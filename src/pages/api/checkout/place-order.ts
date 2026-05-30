import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { transitionOrderState } from '@/services/nodehive/checkout-transition.service';

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
    const drupalSession = cookies.get('drupal_s')?.value;
    if (!drupalSession) {
      return new Response(JSON.stringify({ ok: false, error: 'No Drupal session cookie' }), { status: 401 });
    }

    const orderLang = lang === 'es' ? 'es' : 'en';

    console.log(`[place-order] Placing order ${orderUuid}`, {
      shipping: !!shippingAddress,
      billing: !!billingAddress,
      method: shippingMethod,
      recipient: !!recipientContact,
    });

    // Step 1: Fetch order to get drupal_internal__order_id
    const orderUrl = `${baseUrl}/${orderLang}/jsonapi/commerce_order/default/${orderUuid}`;
    const orderRes = await fetch(orderUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (!orderRes.ok) {
      throw new Error(`Failed to fetch order: ${orderRes.status}`);
    }

    const orderData = await orderRes.json();
    const internalOrderId = orderData?.data?.attributes?.drupal_internal__order_id;
    if (!internalOrderId) {
      throw new Error('Could not determine internal order ID');
    }

    // Step 2: Build custom data payload
    const customData: Record<string, any> = {};
    if (shippingAddress) customData.shipping_address = shippingAddress;
    if (billingAddress) customData.billing_address = billingAddress;
    if (shippingMethod) customData.shipping_method = shippingMethod;
    if (recipientContact) customData.recipient_contact = recipientContact;

    const orderNumber = `MF-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    // Step 3: PATCH non-state fields + checkout_step
    const patchBody = {
      data: {
        type: 'commerce_order--default',
        id: orderUuid,
        attributes: {
          order_number: orderNumber,
          checkout_step: 'review',
          field_checkout_started: false,
        },
      },
    } as any;

    if (Object.keys(customData).length > 0) {
      patchBody.data.attributes.data = customData;
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

    console.log(`[place-order] Fields patched, internal order ID: ${internalOrderId}`);

    // Step 4: Transition order state via checkout form submission
    const transition = await transitionOrderState({
      baseUrl,
      orderUuid,
      orderId: internalOrderId,
      drupalSession,
      csrfToken,
      accessToken,
      lang: orderLang,
    });

    if (!transition.ok) {
      throw new Error(`State transition failed: ${transition.error}`);
    }

    console.log(`[place-order] Order ${orderUuid} placed -> ${orderNumber}`);

    return new Response(JSON.stringify({
      ok: true,
      orderId: orderUuid,
      orderNumber,
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
