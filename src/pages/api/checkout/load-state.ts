import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const orderUuid = url.searchParams.get('orderUuid');
  if (!orderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing orderUuid' }), { status: 400 });
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    const res = await fetch(
      `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}?fields[commerce_order--default]=field_checkout_data,checkout_step,state`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `Drupal responded ${res.status}` }),
        { status: res.status },
      );
    }

    const data = await res.json();
    const attrs = data?.data?.attributes ?? {};
    let checkoutData = null;
    if (attrs.field_checkout_data) {
      try { checkoutData = JSON.parse(attrs.field_checkout_data); } catch { checkoutData = null; }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        checkoutData,
        checkoutStep: attrs.checkout_step ?? null,
        state: attrs.state ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[checkout/load-state] Error:', err.message);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
