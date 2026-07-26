import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { getVariationStockByInternalId } from '@/services/nodehive/nodehive.stock';

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

    // ── Stock validation: re-check before capturing payment ──
    try {
      const orderItemsRes = await fetch(
        `${baseUrl}/en/jsonapi/commerce_order/default/${drupalOrderUuid}?include=order_items&fields[commerce_order--default]=drupal_internal__order_id&fields[commerce_order_item--default]=quantity,purchased_entity`,
        {
          headers: {
            Accept: 'application/vnd.api+json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (orderItemsRes.ok) {
        const orderJson = await orderItemsRes.json();
        const variationQtys = new Map<number, number>();
        for (const inc of orderJson?.included ?? []) {
          if (inc?.type !== 'commerce_order_item--default') continue;
          const vid = inc?.relationships?.purchased_entity?.data?.meta?.drupal_internal__target_id;
          if (!vid) continue;
          const qty = parseFloat(inc?.attributes?.quantity ?? '0') || 0;
          variationQtys.set(vid, (variationQtys.get(vid) ?? 0) + qty);
        }
        if (variationQtys.size > 0) {
          const stockMap = await getVariationStockByInternalId(Array.from(variationQtys.keys()));
          for (const [vid, requested] of variationQtys) {
            const available = stockMap.get(vid) ?? 0;
            if (requested > available) {
              return new Response(JSON.stringify({
                ok: false,
                error: 'STOCK_CHANGED',
                items: [{ variationId: vid, available, requested }],
              }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[paypal-capture] Stock validation error (non-blocking):', e);
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
      return new Response(JSON.stringify({
        ok: false,
        error: approveData.message ?? 'Payment failed at the payment server',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
