import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const GET: APIRoute = async ({ request }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/drupal_s=([^;]+)/);
  const drupalS = match ? decodeURIComponent(match[1]) : undefined;

  if (!drupalS) {
    return new Response(JSON.stringify({ error: 'No drupal_s cookie found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cart = await nodehiveFetch('/cart?_format=json', {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    sessionCookie: drupalS,
    skipApiKey: true,
  });

  const cartData = cart.data as any[];
  const itemUuids = (cartData ?? [])
    .flatMap((o: any) => o.order_items ?? [])
    .map((i: any) => i.uuid)
    .filter(Boolean);

  let customizations = null;
  if (itemUuids.length > 0) {
    const valueParams = itemUuids
      .map((u: string) => `filter[id][condition][value][]=${encodeURIComponent(u)}`)
      .join('&');
    const custRes = await nodehiveFetch(
      `/jsonapi/commerce_order_item/default?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' } }
    );
    customizations = custRes.data;
  }

  return new Response(JSON.stringify({ cart: cart.data, customizations }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
