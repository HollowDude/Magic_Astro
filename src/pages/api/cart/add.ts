import type { APIRoute } from 'astro';
import { addToCart, RIBBON_COLOR_MAP } from '@/services/nodehive/nodehive.cart';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { relayCartCookie } from './cookie-helper';

interface CartItemInput {
  purchased_entity_type: string;
  purchased_entity_id: number;
  quantity: number;
  combine?: boolean;
  cardMessage?: string;
  ribbonColor?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const items = body as CartItemInput[];

  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Debes enviar un array con al menos un producto.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const drupalSession = cookies.get('drupal_s')?.value;
  const decoded = drupalSession ? decodeURIComponent(drupalSession) : undefined;

  const cartItems = items.map(({ cardMessage, ribbonColor, ...rest }) => rest);
  const customizations = items.map(({ cardMessage, ribbonColor }) => ({ cardMessage, ribbonColor }));

  const result = await addToCart(cartItems, decoded);

  const createdItems = (result.data ?? []) as Array<{ uuid: string; order_item_id: number }>;

  const setCookie = result.headers.get('set-cookie');
  let sessionToUse = decoded;
  if (setCookie) {
    const rawSession = setCookie.match(/^([^=]+=[^;]+)/)?.[1];
    if (rawSession) sessionToUse = rawSession;
  }

  const hasCustomizations = customizations.some(c => c && (c.cardMessage || c.ribbonColor));
  if (hasCustomizations && sessionToUse) {
    const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');
    let csrfToken: string | null = null;
    try {
      const csrfRes = await fetch(`${baseUrl}/session/token`, {
        headers: { Cookie: sessionToUse },
      });
      if (csrfRes.ok) csrfToken = await csrfRes.text();
    } catch { /* ignore */ }

    if (csrfToken) {
      for (let i = 0; i < createdItems.length; i++) {
        const item = createdItems[i];
        const cust = customizations[i] ?? customizations[0];
        if (cust && (cust.cardMessage || cust.ribbonColor)) {
          const patchBody: Record<string, unknown> = {
            data: {
              type: 'commerce_order_item--default',
              id: item.uuid,
              attributes: { field_has_card: !!cust.cardMessage },
            },
          };
          if (cust.cardMessage) {
            (patchBody.data as Record<string, any>).attributes.field_card_message = cust.cardMessage;
          }
          if (cust.ribbonColor) {
            (patchBody.data as Record<string, any>).relationships = {
              field_ribbon_color: {
                data: { type: 'taxonomy_term--ribbon_color', id: cust.ribbonColor },
              },
            };
          }
          try {
            const patchRes = await nodehiveFetch(`/jsonapi/commerce_order_item/default/${item.uuid}`, {
              method: 'PATCH',
              body: patchBody,
              headers: {
                'Content-Type': 'application/vnd.api+json',
                Accept: 'application/vnd.api+json',
                'X-CSRF-Token': csrfToken,
              },
              sessionCookie: sessionToUse,
              skipApiKey: true,
            });
            if (patchRes.status !== 200) {
              console.error(`[cart/add] PATCH ${item.uuid} returned ${patchRes.status}`, patchRes.data);
            }
          } catch (e) {
            console.error(`[cart/add] PATCH ${item.uuid} failed:`, e);
          }
        }
      }
    } else {
      console.error('[cart/add] Could not get CSRF token — customization not saved');
    }
  }

  const enrichedItems = createdItems.map((item, i) => {
    const ribbonUuid = customizations[i]?.ribbonColor;
    return {
      ...item,
      hasCard: !!(customizations[i]?.cardMessage),
      cardMessage: customizations[i]?.cardMessage ?? null,
      ribbonColor: ribbonUuid ? (RIBBON_COLOR_MAP[ribbonUuid] ?? null) : null,
    };
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...relayCartCookie(result.headers, '/api/cart'),
  };

  return new Response(JSON.stringify(enrichedItems), {
    status: 200,
    headers,
  });
};
