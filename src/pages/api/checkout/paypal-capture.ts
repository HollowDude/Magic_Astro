import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { drupalCookieHeader } from '../cart/cookie-helper';

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
      const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
      const userAccessToken = session.accessToken ?? '';

      try {
        const getRes = await fetch(
          `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}?fields[commerce_order--default]=field_checkout_data`,
          {
            headers: {
              Accept: 'application/vnd.api+json',
              ...(userAccessToken ? { Authorization: `Bearer ${userAccessToken}` } : {}),
            },
          },
        );

        let existingData: Record<string, any> = {};
        if (getRes.ok) {
          const orderJson = await getRes.json();
          const existingRaw = orderJson?.data?.attributes?.field_checkout_data;
          if (existingRaw) {
            try { existingData = JSON.parse(existingRaw); } catch {}
          }
        }

        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

        const mergedData = {
          ...existingData,
          paypal_capture_id: captureId,
          paypal_status: captureStatus,
          paypal_captured_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        let drupalCookieValue: string | undefined;
        let internalId: number | null = null;

        const drupalCookieRaw = cookies.get('drupal_s')?.value;
        const drupalCookieValueDecoded = drupalCookieRaw ? decodeURIComponent(drupalCookieRaw) : undefined;

        let csrfToken = session.csrfToken ?? '';
        try {
          const csrfRes = await fetch(`${baseUrl}/session/token`, {
            headers: {
              ...(drupalCookieValueDecoded ? { Cookie: `drupal_s=${drupalCookieValueDecoded}` } : {}),
            },
          });
          if (csrfRes.ok) csrfToken = await csrfRes.text();
        } catch {}

        async function patchOrder(attrs: Record<string, any>): Promise<{ ok: boolean; data?: any; error?: string }> {
          try {
            const res = await fetch(
              `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/vnd.api+json',
                  Accept: 'application/vnd.api+json',
                  'X-CSRF-Token': csrfToken,
                  ...(userAccessToken ? { Authorization: `Bearer ${userAccessToken}` } : {}),
                },
                body: JSON.stringify({
                  data: {
                    type: 'commerce_order--default',
                    id: orderUuid,
                    attributes: attrs,
                  },
                }),
              },
            );
            const text = await res.text();
            const parsed = JSON.parse(text);
            if (!res.ok) {
              const errDetail = parsed?.errors?.[0]?.detail ?? `HTTP ${res.status}`;
              return { ok: false, error: errDetail };
            }
            return { ok: true, data: parsed };
          } catch (e: any) {
            return { ok: false, error: e.message };
          }
        }

        const dataResult = await patchOrder({
          field_checkout_data: JSON.stringify(mergedData),
        });
        drupalUpdateResult = dataResult.data;

        if (dataResult.ok && dataResult.data?.data?.attributes?.drupal_internal__order_id) {
          internalId = dataResult.data.data.attributes.drupal_internal__order_id;
          drupalCookieValue = drupalCookieHeader(drupalCookieRaw);
        }

        const stateResult = await patchOrder({
          state: 'fulfillment',
        });

        if (!stateResult.ok) {
          console.warn('[paypal-capture] State transition failed:', stateResult.error);
        } else if (stateResult.data?.data?.attributes?.drupal_internal__order_id && !internalId) {
          internalId = stateResult.data.data.attributes.drupal_internal__order_id;
          drupalCookieValue = drupalCookieHeader(drupalCookieRaw);
        }

        if (internalId && userAccessToken) {
          const amt = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount
            ?? captureData.purchase_units?.[0]?.amount
            ?? { value: '0', currency_code: 'USD' };

          try {
            const paymentRes = await fetch(
              `${baseUrl}/en/jsonapi/commerce_payment/payment_default`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/vnd.api+json',
                  Accept: 'application/vnd.api+json',
                  'X-CSRF-Token': csrfToken,
                  Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                  data: {
                    type: 'commerce_payment--payment_default',
                    attributes: {
                      amount: {
                        number: amt.value,
                        currency_code: amt.currency_code,
                      },
                      state: 'completed',
                      remote_id: captureId ?? '',
                      remote_status: captureStatus,
                      remote_details: [{ value: JSON.stringify(captureData) }],
                      payment_gateway_mode: 'test',
                    },
                    relationships: {
                      order_id: {
                        data: {
                          type: 'commerce_order--default',
                          id: orderUuid,
                        },
                      },
                      payment_gateway: {
                        data: {
                          type: 'commerce_payment_gateway--commerce_payment_gateway',
                          id: '26e8f444-7840-4f84-ad0f-06873af18a78',
                        },
                      },
                    },
                  },
                }),
              },
            );

            if (!paymentRes.ok) {
              const errText = await paymentRes.text().catch(() => '');
              console.warn('[paypal-capture] Payment entity creation failed:', paymentRes.status, errText.slice(0, 500));
            }
          } catch (e: any) {
            console.warn('[paypal-capture] Payment entity error:', e.message);
          }

          (async () => {
            const billingAddr = existingData.billing_address;
            if (!billingAddr?.address_line1) return;

            try {
              const userRes = await fetch(
                `${baseUrl}/en/jsonapi/user/user?filter[drupal_internal__uid]=${session.uid}&page[limit]=1`,
                {
                  headers: {
                    Accept: 'application/vnd.api+json',
                    Authorization: `Bearer ${userAccessToken}`,
                  },
                },
              );
              const userJson = await userRes.json().catch(() => ({}));
              const userUuid = userJson?.data?.[0]?.id;
              if (!userUuid) return;

              const profileRes = await fetch(`${baseUrl}/en/jsonapi/profile/customer`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/vnd.api+json',
                  Accept: 'application/vnd.api+json',
                  'X-CSRF-Token': csrfToken,
                  Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                  data: {
                    type: 'profile--customer',
                    attributes: {
                      address: {
                        country_code: billingAddr.country_code ?? 'US',
                        address_line1: billingAddr.address_line1 ?? '',
                        address_line2: billingAddr.address_line2 ?? '',
                        locality: billingAddr.locality ?? billingAddr.city ?? '',
                        administrative_area: billingAddr.administrative_area ?? billingAddr.state ?? '',
                        postal_code: billingAddr.postal_code ?? billingAddr.zip ?? '',
                        given_name: billingAddr.firstName ?? billingAddr.given_name ?? '',
                        family_name: billingAddr.lastName ?? billingAddr.family_name ?? '',
                      },
                    },
                    relationships: {
                      uid: {
                        data: { type: 'user--user', id: userUuid },
                      },
                    },
                  },
                }),
              });

              if (!profileRes.ok) return;
              const profileJson = await profileRes.json();
              const profileUuid = profileJson?.data?.id;
              if (!profileUuid) return;

              await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/vnd.api+json',
                  Accept: 'application/vnd.api+json',
                  'X-CSRF-Token': csrfToken,
                  Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                  data: {
                    type: 'commerce_order--default',
                    id: orderUuid,
                    relationships: {
                      billing_information: {
                        data: { type: 'profile--customer', id: profileUuid },
                      },
                    },
                  },
                }),
              });
            } catch (e: any) {
              console.warn('[paypal-capture] Billing profile error:', e.message);
            }
          })();
        }

        if (internalId && drupalCookieValue) {
          try {
            await fetch(`${baseUrl}/cart/${internalId}/items?_format=json`, {
              method: 'DELETE',
              headers: {
                Accept: 'application/json',
                Cookie: drupalCookieValue,
              },
            });
          } catch {
            // non-blocking
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
