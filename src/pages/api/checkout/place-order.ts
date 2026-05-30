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

  try {
    const csrfToken = session.csrfToken ?? '';
    const accessToken = session.accessToken ?? '';
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const orderUrl = `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`;

    const getRes = await fetch(`${orderUrl}?fields[commerce_order--default]=order_number`, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    const getJson = await getRes.json().catch(() => ({}));
    const existingOrderNumber = getJson?.data?.attributes?.order_number ?? '';

    const customData: Record<string, any> = {};
    if (shippingAddress) customData.shipping_address = shippingAddress;
    if (billingAddress) customData.billing_address = billingAddress;
    if (shippingMethod) customData.shipping_method = shippingMethod;
    if (recipientContact) customData.recipient_contact = recipientContact;

    const patchBody: Record<string, any> = {
      data: {
        type: 'commerce_order--default',
        id: orderUuid,
        attributes: {},
      },
    };

    if (Object.keys(customData).length > 0) {
      patchBody.data.attributes.field_checkout_data = JSON.stringify(customData);
    }

    const patchRes = await fetch(orderUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(patchBody),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      console.error(`[place-order] PATCH failed (${patchRes.status}):`, errText.slice(0, 500));
      throw new Error(`Drupal PATCH failed (${patchRes.status})`);
    }

    return new Response(JSON.stringify({
      ok: true,
      orderId: orderUuid,
      orderNumber: existingOrderNumber,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[place-order] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
