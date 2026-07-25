import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

const GATEWAY_ID = 'paypal_checkout';

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

  const { paypalOrderId, drupalOrderUuid, payerId } = body;
  if (!paypalOrderId || !drupalOrderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    const getRes = await fetch(
      `${baseUrl}/en/jsonapi/commerce_order/default/${drupalOrderUuid}?fields[commerce_order--default]=drupal_internal__order_id`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!getRes.ok) {
      throw new Error('Failed to fetch order');
    }
    const getJson = await getRes.json();
    const internalId = getJson?.data?.attributes?.drupal_internal__order_id;
    if (!internalId) {
      throw new Error('Internal order ID not found');
    }

    const approveRes = await fetch(
      `${baseUrl}/commerce-paypal/checkout-approve/${GATEWAY_ID}/${internalId}?_format=json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: paypalOrderId,
          PayerID: payerId ?? null,
        }),
      },
    );

    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      throw new Error(approveData.message ?? `Capture failed (${approveRes.status})`);
    }

    // ── Transition order state to "fulfillment" (En proceso) ──
    // Drupal's checkout-approve captures payment via PayPal but doesn't
    // transition the order. The workflow is: placed (Pedido hecho) →
    // fulfillment (En proceso) → completed (Completado, admin only).
    try {
      await fetch(
        `${baseUrl}/commerce-paypal-headless/place/${internalId}?_format=json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (stateErr) {
      console.warn('[paypal-capture] State transition failed:', stateErr);
    }

    return new Response(JSON.stringify({
      ok: true,
      status: approveData.status,
      paypalOrderId,
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
