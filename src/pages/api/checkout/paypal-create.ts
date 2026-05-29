import type { APIRoute } from 'astro';

const PAYPAL_API = import.meta.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = import.meta.env.PAYPAL_CLIENT_ID;
  const clientSecret = import.meta.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'your-paypal-client-id') {
    throw new Error('PayPal not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? 'PayPal auth failed');
  return data.access_token;
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const { orderId, amount, currency, returnUrl, cancelUrl } = body;

  if (!amount || !returnUrl || !cancelUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken();

    const paypalOrderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: String(orderId),
          amount: {
            currency_code: currency ?? 'USD',
            value: String(amount),
          },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: returnUrl,
              cancel_url: cancelUrl,
              user_action: 'PAY_NOW',
            },
          },
        },
      }),
    });

    const paypalOrder = await paypalOrderRes.json();

    if (!paypalOrderRes.ok) {
      throw new Error(paypalOrder.message ?? 'PayPal order creation failed');
    }

    const approvalLink = paypalOrder.links?.find((l: any) => l.rel === 'payer-action')?.href;

    return new Response(JSON.stringify({
      ok: true,
      approvalUrl: approvalLink,
      paypalOrderId: paypalOrder.id,
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
