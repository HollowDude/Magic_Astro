import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { transitionOrderState } from '@/services/nodehive/checkout-transition.service';

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
    const gatewayUuid = import.meta.env.ZELLE_PAYMENT_GATEWAY_UUID as string;

    console.log('[zelle-create] orderUuid:', orderUuid, 'gatewayUuid:', gatewayUuid, 'amount:', amount);

    if (!orderUuid || orderUuid === 'undefined') {
      console.warn('[zelle-create] Invalid orderUuid detected');
      return new Response(JSON.stringify({ ok: false, error: 'Invalid order UUID' }), { status: 400 });
    }
    if (!gatewayUuid) {
      console.warn('[zelle-create] ZELLE_PAYMENT_GATEWAY_UUID not set — restart dev server after adding .env vars');
      return new Response(JSON.stringify({ ok: false, error: 'Payment gateway not configured' }), { status: 500 });
    }

    let csrfToken = session.csrfToken ?? '';
    try {
      const csrfRes = await fetch(`${baseUrl}/session/token`);
      if (csrfRes.ok) csrfToken = await csrfRes.text();
    } catch {}

    const requestBody = {
      data: {
        type: 'commerce_payment--payment_manual',
        attributes: {
          amount: { number: String(amount), currency_code: 'USD' },
          state: 'pending',
          remote_id: '',
          remote_status: 'awaiting_zelle',
          payment_gateway_mode: 'test',
        },
        relationships: {
          order_id: {
            data: { type: 'commerce_order--default', id: orderUuid },
          },
          payment_gateway: {
            data: {
              type: 'commerce_payment_gateway--commerce_payment_gateway',
              id: gatewayUuid,
            },
          },
        },
      },
    };

    console.log('[zelle-create] Request body:', JSON.stringify(requestBody));

    const paymentRes = await fetch(`${baseUrl}/en/jsonapi/commerce_payment/payment_manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!paymentRes.ok) {
      const errText = await paymentRes.text().catch(() => '');
      console.warn('[zelle-create] Payment entity error:', paymentRes.status, errText.slice(0, 500));
    }

    const paymentJson = await paymentRes.json().catch(() => ({}));
    const paymentEntityId = paymentJson?.data?.id ?? null;
    console.log('[zelle-create] Payment entity created:', paymentEntityId);

    const transition = await transitionOrderState({
      baseUrl,
      orderUuid,
      csrfToken,
      accessToken,
      targetState: 'fulfillment',
    });

    if (!transition.ok) {
      console.warn('[zelle-create] State transition to fulfillment failed:', transition.error);
    }

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
