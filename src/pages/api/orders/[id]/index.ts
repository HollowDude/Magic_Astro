import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing order ID' }), { status: 400 });
  }

  try {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    const res = await fetch(`${baseUrl}/en/jsonapi/commerce_order/default/${id}?include=order_items`, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Drupal responded ${res.status}` }), { status: res.status });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data }), {
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
