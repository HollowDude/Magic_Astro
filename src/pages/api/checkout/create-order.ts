import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

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

  const { cartItems, shippingAddress, shippingMethod, billingAddress, paymentMethod, recipientContact, lang } = body;

  const drupalCookie = cookies.get('drupal_s')?.value;
  const decodedSession = drupalCookie ? decodeURIComponent(drupalCookie) : undefined;

  const orderNumber = `MF-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

  try {
    const orderRes = await fetch(`${import.meta.env.NODEHIVE_BASE_URL}/cart/${cartItems?.[0]?.orderId ?? ''}?_format=json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: `drupal_s=${encodeURIComponent(decodedSession ?? '')}`,
      },
    });

    const orderData = await orderRes.json().catch(() => ({}));

    return new Response(JSON.stringify({
      ok: true,
      orderId: orderData?.order_id ?? cartItems?.[0]?.orderId ?? 0,
      orderNumber,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
