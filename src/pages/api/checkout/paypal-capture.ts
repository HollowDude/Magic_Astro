import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

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

  const { paypalOrderId, drupalOrderId, drupalOrderUuid } = body;

  if (!paypalOrderId) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing PayPal order ID' }), { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      throw new Error(captureData.message ?? 'PayPal capture failed');
    }

    const captureStatus = captureData.status;
    const isCompleted = captureStatus === 'COMPLETED';

    let drupalUpdateResult: any = null;
    const orderUuid = drupalOrderUuid || drupalOrderId;

    if (orderUuid && isCompleted) {
      const csrfToken = session.csrfToken ?? '';
      const userAccessToken = session.accessToken ?? '';
      const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');

      try {
        const patchBody: Record<string, any> = {
          data: {
            type: 'commerce_order--default',
            id: orderUuid,
            attributes: {
              state: 'fulfillment',
              cart: false,
            },
          },
        };

        const drupalRes = await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'application/vnd.api+json',
            'X-CSRF-Token': csrfToken,
            ...(userAccessToken ? { Authorization: `Bearer ${userAccessToken}` } : {}),
          },
          body: JSON.stringify(patchBody),
        });

        const responseText = await drupalRes.text();
        try { drupalUpdateResult = JSON.parse(responseText); } catch { drupalUpdateResult = responseText; }

        if (drupalRes.ok) {
          const drupalCookie = cookies.get('drupal_s')?.value;
          const decodedSession = drupalCookie ? decodeURIComponent(drupalCookie) : undefined;
          const internalId = drupalUpdateResult?.data?.attributes?.drupal_internal__order_id;

          if (internalId && decodedSession) {
            try {
              await fetch(`${baseUrl}/cart/${internalId}/items?_format=json`, {
                method: 'DELETE',
                headers: {
                  Accept: 'application/json',
                  Cookie: `drupal_s=${encodeURIComponent(decodedSession)}`,
                },
              });
            } catch {
              // non-blocking
            }
          }
        }
      } catch {
        // non-blocking
      }
    }

    return new Response(JSON.stringify({
      ok: isCompleted,
      status: captureStatus,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
      drupalUpdate: drupalUpdateResult,
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
