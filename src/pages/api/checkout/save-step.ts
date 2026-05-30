import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const { orderUuid, step, data } = body;
  if (!orderUuid || typeof step !== 'number' || step < 0 || step > 3) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing or invalid orderUuid/step' }),
      { status: 400 },
    );
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    const getRes = await fetch(
      `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}?fields[commerce_order--default]=field_checkout_data,field_checkout_started`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
    );

    if (!getRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `Failed to fetch order: ${getRes.status}` }),
        { status: 502 },
      );
    }

    const orderJson = await getRes.json();
    const attrs = orderJson?.data?.attributes ?? {};
    const existingRaw = attrs.field_checkout_data;
    let existingData: Record<string, any> = {};

    if (existingRaw) {
      try {
        existingData = JSON.parse(existingRaw);
      } catch {
        existingData = {};
      }
    }

    const mergedData = {
      ...existingData,
      ...(data || {}),
      currentStep: step,
      updatedAt: new Date().toISOString(),
      stepsCompleted: existingData.stepsCompleted
        ? Array.from(new Set([...existingData.stepsCompleted, step - 1].filter((s: number) => s >= 0)))
        : step > 0 ? [step - 1] : [],
    };

    let csrfToken = session.csrfToken ?? '';
    try {
      const csrfRes = await fetch(`${baseUrl}/session/token`);
      if (csrfRes.ok) csrfToken = await csrfRes.text();
    } catch {}

    const patchRes = await fetch(
      `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          'X-CSRF-Token': csrfToken,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          data: {
            type: 'commerce_order--default',
            id: orderUuid,
            attributes: {
              field_checkout_data: JSON.stringify(mergedData),
            },
          },
        }),
      },
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      console.error(`[save-step] PATCH failed (${patchRes.status}): ${errText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ ok: false, error: `Drupal PATCH failed: ${patchRes.status}` }),
        { status: 502 },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[save-step] Error:', err.message);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
