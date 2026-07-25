import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

const VALID_TRANSITIONS = ['placed', 'fulfillment', 'completed', 'canceled'] as const;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing order ID' }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const newState = body.state;
  if (!newState || !VALID_TRANSITIONS.includes(newState)) {
    return new Response(JSON.stringify({
      ok: false,
      error: `Invalid state "${newState}". Must be one of: ${VALID_TRANSITIONS.join(', ')}`,
    }), { status: 400 });
  }

  try {
    const csrfToken = session.csrfToken ?? '';
    const accessToken = session.accessToken ?? '';
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');

    const patchBody: Record<string, any> = {
      data: {
        type: 'commerce_order--default',
        id,
        attributes: {
          state: newState,
        },
      },
    };

    if (newState === 'completed') {
      patchBody.data.attributes.completed = new Date().toISOString();
    }

    const res = await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(patchBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Drupal PATCH failed (${res.status}): ${errText}`);
    }

    const updated = await res.json();

    return new Response(JSON.stringify({
      ok: true,
      state: newState,
      data: updated,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
