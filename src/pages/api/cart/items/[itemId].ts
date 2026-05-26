import type { APIRoute } from 'astro';
import { removeCartItem, updateCartItem } from '@/services/nodehive/nodehive.cart';
import { relayCartCookie } from '../cookie-helper';

function parseItemId(params: Record<string, string | undefined>): number | null {
  const raw = params.itemId;
  if (!raw || !/^\d+$/.test(raw)) return null;
  return parseInt(raw, 10);
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getSessionCookie(cookies: any): Promise<string | undefined> {
  const raw = cookies.get('drupal_s')?.value;
  return raw ? decodeURIComponent(raw) : undefined;
}

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const itemId = parseItemId(params);
  if (!itemId) return errorResponse('Invalid item ID', 400);

  let body: { order_id: number };
  try { body = await request.json(); } catch { return errorResponse('Invalid body', 400); }
  if (!body.order_id) return errorResponse('order_id required', 400);

  const decoded = await getSessionCookie(cookies);
  const result = await removeCartItem(body.order_id, itemId, decoded);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...relayCartCookie(result.headers, '/api/cart'),
  };

  return new Response(JSON.stringify({ ok: result.success }), {
    status: result.success ? 200 : 500,
    headers,
  });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const itemId = parseItemId(params);
  if (!itemId) return errorResponse('Invalid item ID', 400);

  let body: { order_id: number; quantity: number };
  try { body = await request.json(); } catch { return errorResponse('Invalid body', 400); }
  if (!body.order_id) return errorResponse('order_id required', 400);
  if (typeof body.quantity !== 'number' || body.quantity < 1) return errorResponse('quantity must be >= 1', 400);

  const decoded = await getSessionCookie(cookies);
  const result = await updateCartItem(body.order_id, itemId, body.quantity, decoded);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...relayCartCookie(result.headers, '/api/cart'),
  };

  return new Response(JSON.stringify({ ok: true, item: result.data }), {
    status: 200,
    headers,
  });
};
