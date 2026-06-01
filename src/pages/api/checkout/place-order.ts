import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

const GATEWAY_ID = 'paypal_checkout';

async function createBillingProfile(
  baseUrl: string,
  accessToken: string,
  csrfToken: string,
  sessionUid: string,
  address: Record<string, any>,
): Promise<string | null> {
  try {
    const userRes = await fetch(
      `${baseUrl}/en/jsonapi/user/user?filter[drupal_internal__uid]=${sessionUid}&page[limit]=1`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!userRes.ok) return null;
    const userJson = await userRes.json();
    const userUuid = userJson?.data?.[0]?.id;
    if (!userUuid) return null;

    const profileRes = await fetch(`${baseUrl}/en/jsonapi/profile/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        data: {
          type: 'profile--customer',
          attributes: {
            address: {
              country_code: address.country_code ?? 'US',
              address_line1: address.address_line1 ?? '',
              address_line2: address.address_line2 ?? '',
              locality: address.locality ?? address.city ?? '',
              administrative_area: address.administrative_area ?? address.state ?? '',
              postal_code: address.postal_code ?? address.zip ?? '',
              given_name: address.firstName ?? address.given_name ?? '',
              family_name: address.lastName ?? address.family_name ?? '',
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

    if (!profileRes.ok) {
      const errText = await profileRes.text().catch(() => '');
      console.warn('[billing-profile] Creation failed:', profileRes.status, errText.slice(0, 300));
      return null;
    }

    const profileJson = await profileRes.json();
    return profileJson?.data?.id ?? null;
  } catch (e: any) {
    console.warn('[billing-profile] Error:', e.message);
    return null;
  }
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

  const { orderUuid, shippingAddress, billingAddress, shippingMethod, recipientContact, paymentMethod, lang, returnUrl, cancelUrl } = body;

  if (!orderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing orderUuid' }), { status: 400 });
  }

  try {
    const csrfToken = session.csrfToken ?? '';
    const accessToken = session.accessToken ?? '';
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const orderUrl = `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}`;

    const getRes = await fetch(`${orderUrl}?fields[commerce_order--default]=order_number,drupal_internal__order_id,field_checkout_data`, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    const getJson = await getRes.json().catch(() => ({}));
    const existingOrderNumber = getJson?.data?.attributes?.order_number ?? '';
    const internalOrderId = getJson?.data?.attributes?.drupal_internal__order_id;

    let existingData: Record<string, any> = {};
    const existingRaw = getJson?.data?.attributes?.field_checkout_data;
    if (existingRaw) {
      try { existingData = JSON.parse(existingRaw); } catch {}
    }

    const { paypal_capture_id: _, paypal_status: __, ...cleanExisting } = existingData;
    const mergedData: Record<string, any> = {
      ...cleanExisting,
      shippingAddress: shippingAddress ?? existingData.shippingAddress ?? null,
      billingAddress: billingAddress ?? existingData.billingAddress ?? null,
      shippingMethod: shippingMethod ?? existingData.shippingMethod ?? null,
      recipientContact: recipientContact ?? existingData.recipientContact ?? null,
      paymentMethod: paymentMethod ?? 'paypal',
      return_url: returnUrl ?? existingData.return_url ?? existingData.returnUrl ?? '',
      cancel_url: cancelUrl ?? existingData.cancel_url ?? existingData.cancelUrl ?? '',
      updatedAt: new Date().toISOString(),
    };

    const patchBody: Record<string, any> = {
      data: {
        type: 'commerce_order--default',
        id: orderUuid,
        attributes: {},
      },
    };

    patchBody.data.attributes.field_checkout_data = JSON.stringify(mergedData);

    if (billingAddress?.address_line1) {
      const profileUuid = await createBillingProfile(baseUrl, accessToken, csrfToken, session.uid, billingAddress);
      if (profileUuid) {
        patchBody.data.relationships ??= {};
        patchBody.data.relationships.billing_information = {
          data: { type: 'profile--customer', id: profileUuid },
        };
      }
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

    let approvalUrl: string | null = null;
    let paypalOrderId: string | null = null;

    if (paymentMethod === 'paypal' && internalOrderId) {
      const createRes = await fetch(
        `${baseUrl}/commerce-paypal/checkout-create/${GATEWAY_ID}/${internalOrderId}?_format=json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            return_url: body.returnUrl ?? body.return_url ?? '',
            cancel_url: body.cancelUrl ?? body.cancel_url ?? '',
          }),
        },
      );

      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => '');
        console.error('[place-order] PayPal create-order failed:', createRes.status, errText.slice(0, 300));
        throw new Error(`PayPal order creation failed: ${createRes.status}`);
      }

      const createData = await createRes.json();
      paypalOrderId = createData.id;
      const isSandbox = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost') || baseUrl.includes('magback.lombaoestudios.com');
      approvalUrl = isSandbox
        ? `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`
        : `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;
    }

    return new Response(JSON.stringify({
      ok: true,
      orderId: orderUuid,
      orderNumber: existingOrderNumber,
      internalId: internalOrderId,
      approvalUrl,
      paypalOrderId,
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
