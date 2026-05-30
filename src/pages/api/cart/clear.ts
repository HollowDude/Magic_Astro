import type { APIRoute } from 'astro';
import { clearCart } from '@/services/nodehive/nodehive.cart';
import { relayCartCookie } from './cookie-helper';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { order_id: number };
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.order_id) {
    return new Response(JSON.stringify({ ok: false, error: 'order_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const drupalSessionRaw = cookies.get('drupal_s')?.value;
  const decoded = drupalSessionRaw ? decodeURIComponent(drupalSessionRaw) : undefined;
  const result = await clearCart(body.order_id, decoded);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...relayCartCookie(result.headers, drupalSessionRaw),
  };

  return new Response(JSON.stringify({ ok: result.success }), {
    status: result.success ? 200 : 500,
    headers,
  });
};
