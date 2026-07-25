import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { transitionOrderState } from '@/services/nodehive/checkout-transition.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const { orderUuid } = body;
  if (!orderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing orderUuid' }), { status: 400 });
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';
    const csrfToken = session.csrfToken ?? '';

    const orderUrl = `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`;

    // Check current state first — if already placed, return existing order_number (idempotent)
    const checkRes = await fetch(`${orderUrl}?fields[commerce_order--default]=state,order_number`, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (checkRes.ok) {
      const checkJson = await checkRes.json().catch(() => ({}));
      const currentState = checkJson?.data?.attributes?.state;
      const existingNumber = checkJson?.data?.attributes?.order_number;
      if (currentState && currentState !== 'draft') {
        return new Response(JSON.stringify({ ok: true, orderNumber: existingNumber ?? '' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const orderNumber = `MF-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const patchRes = await fetch(orderUrl, {
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
            order_number: orderNumber,
            field_checkout_started: false,
          },
        },
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      console.warn(`[checkout/start] PATCH failed (${patchRes.status}): ${errText}`);
      return new Response(JSON.stringify({ ok: false, error: `PATCH failed: ${patchRes.status}` }), { status: 502 });
    }

    const transition = await transitionOrderState({
      baseUrl,
      orderUuid,
      csrfToken,
      accessToken,
    });

    if (!transition.ok) {
      return new Response(JSON.stringify({ ok: false, error: transition.error }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, orderNumber }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.warn('[checkout/start] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
