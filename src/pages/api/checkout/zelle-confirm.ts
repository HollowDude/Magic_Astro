import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session?.roles?.includes('administrator')) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  const { orderUuid, paymentEntityId, reference } = await request.json().catch(() => ({}));
  const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
  const accessToken = session.accessToken ?? '';

  let csrfToken = '';
  try {
    const r = await fetch(`${baseUrl}/session/token`);
    if (r.ok) csrfToken = await r.text();
  } catch {}

  if (paymentEntityId) {
    await fetch(`${baseUrl}/en/jsonapi/commerce_payment/payment_manual/${paymentEntityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        data: {
          type: 'commerce_payment--payment_manual',
          id: paymentEntityId,
          attributes: { state: 'completed', remote_id: reference ?? '' },
        },
      }),
    }).catch(() => {});
  }

  await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      data: {
        type: 'commerce_order--default',
        id: orderUuid,
        attributes: {
          state: 'fulfillment',
          field_payment_reference: reference ?? '',
        },
      },
    }),
  }).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
