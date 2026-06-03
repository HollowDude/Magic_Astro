import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { orderUuid, amount, orderId, orderNumber } = body;

  if (!orderUuid || !amount) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    // Resolve gateway UUID: try env var first, then fetch by machine name from Drupal
    const gatewayId = (import.meta.env.ZELLE_PAYMENT_GATEWAY_ID as string) || 'zelle';
    let gatewayUuid = import.meta.env.ZELLE_PAYMENT_GATEWAY_UUID as string;
    if (!gatewayUuid) {
      try {
        const gwRes = await fetch(
          `${baseUrl}/commerce-paypal-headless/gateway-uuid/${gatewayId}?_format=json`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        if (gwRes.ok) {
          const gwData = await gwRes.json();
          gatewayUuid = gwData.uuid;
        }
      } catch {}
    }

    console.log('[zelle-create] orderUuid:', orderUuid, 'gatewayUuid:', gatewayUuid, 'amount:', amount);

    if (!orderUuid || orderUuid === 'undefined') {
      console.warn('[zelle-create] Invalid orderUuid detected');
      return new Response(JSON.stringify({ ok: false, error: 'Invalid order UUID' }), { status: 400 });
    }
    if (!gatewayUuid) {
      console.warn('[zelle-create] Payment gateway UUID could not be determined');
      return new Response(JSON.stringify({ ok: false, error: 'Payment gateway not configured' }), { status: 500 });
    }

    // POST to Drupal custom endpoint that creates the Zelle payment
    const paymentRes = await fetch(`${baseUrl}/api/nodehive/zelle-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        order_uuid: orderUuid,
        gateway_uuid: gatewayUuid,
        amount: String(amount),
        currency_code: 'USD',
      }),
    });

    if (!paymentRes.ok) {
      const errText = await paymentRes.text().catch(() => '');
      console.warn('[zelle-create] Payment creation error:', paymentRes.status, errText.slice(0, 500));
    }

    const paymentJson = await paymentRes.json().catch(() => ({}));
    const paymentEntityId = paymentJson?.payment_id ?? paymentJson?.data?.id ?? null;
    console.log('[zelle-create] Payment entity created:', paymentEntityId);

    return new Response(JSON.stringify({
      ok: true,
      zellePhone: import.meta.env.ZELLE_RECIPIENT_PHONE,
      zelleName: import.meta.env.ZELLE_RECIPIENT_NAME,
      amount: Number(amount).toFixed(2),
      orderNumber,
      paymentEntityId,
      pendingUrl: `/${orderId ? 'es' : 'es'}/checkout/pending-zelle?order=${orderNumber}&orderId=${orderUuid}&amount=${amount}`,
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
