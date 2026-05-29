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

  const { orderUuid, shippingAddress, billingAddress, shippingMethod, recipientContact, lang } = body;

  if (!orderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing orderUuid' }), { status: 400 });
  }

  const orderNumber = `MF-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

  try {
    const csrfToken = session.csrfToken ?? '';
    const accessToken = session.accessToken ?? '';
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');

    const patchBody: Record<string, any> = {
      data: {
        type: 'commerce_order--default',
        id: orderUuid,
        attributes: {
          order_number: orderNumber,
          state: 'placed',
          placed: new Date().toISOString(),
          data: {
            paid_event_dispatched: false,
            shipping_address: shippingAddress ?? null,
            billing_address: billingAddress ?? null,
            shipping_method: shippingMethod ?? null,
            recipient_contact: recipientContact ?? null,
          },
        },
      },
    };

    const res = await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`, {
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

    return new Response(JSON.stringify({
      ok: true,
      orderId: orderUuid,
      orderNumber,
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
