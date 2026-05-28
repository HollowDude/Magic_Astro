import type { APIRoute } from 'astro';
import { addToCart, getCart, updateCartItem, fetchRibbonColors, resolveRibbonColorUuid, ribbonColorDefFromUuid } from '@/services/nodehive/nodehive.cart';
import type { RibbonColorDef } from '@/services/nodehive/nodehive.cart';
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

interface MatchKey {
  variationId: number;
  ribbonColorUuid: string | null;
  cardMessage: string | null;
}

interface ExistingItemInfo {
  orderItemId: number;
  uuid: string;
  orderId: number;
  quantity: number;
}

async function fetchExistingCustomizations(
  itemUuids: string[],
): Promise<Map<number, { cardMessage: string | null; ribbonColorUuid: string | null }>> {
  const map = new Map<number, { cardMessage: string | null; ribbonColorUuid: string | null }>();
  if (itemUuids.length === 0) return map;

  try {
    const valueParams = itemUuids
      .map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`)
      .join('&');
    const path = `/jsonapi/commerce_order_item/default?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}`;
    const result = await nodehiveFetch<{ data: Array<Record<string, any>> }>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      skipApiKey: false,
      cacheTtl: 0,
    });

    if (result.status !== 200) return map;

    for (const entry of result.data?.data ?? []) {
      const internalId = entry?.attributes?.drupal_internal__order_item_id;
      if (!internalId) continue;
      const attrs = entry?.attributes ?? {};
      const relData = entry?.relationships?.field_ribbon_color?.data;
      map.set(internalId, {
        cardMessage: attrs.field_card_message ?? null,
        ribbonColorUuid: relData?.id ?? null,
      });
    }
  } catch (e) {
    console.error('[cart/add] fetchExistingCustomizations error:', e);
  }

  return map;
}

function findMatchingItem(
  currentCart: any[],
  customizationsMap: Map<number, { cardMessage: string | null; ribbonColorUuid: string | null }>,
  target: MatchKey,
): ExistingItemInfo | null {
  for (const order of currentCart) {
    for (const item of order.order_items ?? []) {
      if (item.purchased_entity?.variation_id !== target.variationId) continue;

      const cust = customizationsMap.get(item.order_item_id) ?? {
        cardMessage: null,
        ribbonColorUuid: null,
      };

      const ribbonMatch = (cust.ribbonColorUuid ?? null) === (target.ribbonColorUuid ?? null);
      if (!ribbonMatch) continue;

      const cardMatch = (cust.cardMessage ?? null) === (target.cardMessage ?? null);
      if (!cardMatch) continue;

      return {
        orderItemId: item.order_item_id,
        uuid: item.uuid,
        orderId: order.order_id,
        quantity: parseFloat(item.quantity) || 1,
      };
    }
  }
  return null;
}

async function patchOrderItemCustomizations(
  itemUuid: string,
  cardMessage: string | undefined,
  ribbonColorUuid: string | undefined,
  sessionCookie: string | undefined,
): Promise<void> {
  const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');

  let csrfToken: string | null = null;
  try {
    const csrfRes = await fetch(`${baseUrl}/session/token`, {
      headers: { Cookie: sessionCookie ?? '' },
    });
    if (csrfRes.ok) csrfToken = await csrfRes.text();
  } catch {
    return;
  }

  if (!csrfToken) {
    console.error('[cart/add] patchOrderItemCustomizations: no CSRF token');
    return;
  }

  const patchBody: Record<string, unknown> = {
    data: {
      type: 'commerce_order_item--default',
      id: itemUuid,
      attributes: {
        field_has_card: !!cardMessage,
        ...(cardMessage ? { field_card_message: cardMessage } : {}),
      },
      ...(ribbonColorUuid ? {
        relationships: {
          field_ribbon_color: {
            data: { type: 'taxonomy_term--ribbon_color', id: ribbonColorUuid },
          },
        },
      } : {}),
    },
  };

  try {
    const patchRes = await nodehiveFetch(
      `/jsonapi/commerce_order_item/default/${itemUuid}`,
      {
        method: 'PATCH',
        body: patchBody,
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          'X-CSRF-Token': csrfToken,
        },
        sessionCookie,
      },
    );
    if (patchRes.status !== 200) {
      console.error(`[cart/add] PATCH customizations on ${itemUuid} returned ${patchRes.status}`);
    }
  } catch (e) {
    console.error('[cart/add] PATCH customizations error:', e);
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const items = body as CartItemInput[];
  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Array requerido con al menos un item' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const drupalSession = cookies.get('drupal_s')?.value;
  const decoded = drupalSession ? decodeURIComponent(drupalSession) : undefined;

  const ribbonColors = await fetchRibbonColors();

  const cartResult = await getCart(decoded);
  const currentCart = (cartResult.data ?? []) as any[];

  const existingUuids = currentCart
    .flatMap((o: any) => o.order_items ?? [])
    .map((i: any) => i.uuid as string)
    .filter(Boolean);
  const customizationsMap = await fetchExistingCustomizations(existingUuids);

  let latestSetCookie: Headers = cartResult.headers;

  const resultItems: Array<{
    uuid: string;
    order_item_id: number;
    hasCard: boolean;
    cardMessage: string | null;
    ribbonColor: { name: string; hex: string } | null;
  }> = [];

  for (const item of items) {
    const { cardMessage, ribbonColor: ribbonColorName, ...cartItemBase } = item;
    const inputQty = cartItemBase.quantity ?? 1;

    const normalizedCard = cardMessage?.trim() || null;
    const normalizedRibbonName = ribbonColorName?.trim() || null;

    // Resolve UUID from color name dynamically
    const ribbonColorUuid = await resolveRibbonColorUuid(normalizedRibbonName);

    const target: MatchKey = {
      variationId: cartItemBase.purchased_entity_id,
      ribbonColorUuid,
      cardMessage: normalizedCard,
    };

    const existing = findMatchingItem(currentCart, customizationsMap, target);

    // Resolve display name/hex from the fetched ribbon colors
    const ribbonColorDisplay = ribbonColorDefFromUuid(ribbonColorUuid, ribbonColors);

    if (existing) {
      const newQty = existing.quantity + inputQty;
      const updateRes = await updateCartItem(
        existing.orderId,
        existing.orderItemId,
        newQty,
        decoded,
      );
      latestSetCookie = updateRes.headers;

      resultItems.push({
        uuid: existing.uuid,
        order_item_id: existing.orderItemId,
        hasCard: !!normalizedCard,
        cardMessage: normalizedCard,
        ribbonColor: ribbonColorDisplay,
      });
    } else {
      const addRes = await addToCart([{
        ...cartItemBase,
        combine: false,
      }], decoded);
      latestSetCookie = addRes.headers;

      const newItem = (addRes.data ?? [])[0] as any;
      if (!newItem) continue;

      const setCookieHeader = addRes.headers.get('set-cookie');
      let sessionForPatch = decoded;
      if (setCookieHeader) {
        const rawSession = setCookieHeader.match(/^([^=]+=[^;]+)/)?.[1];
        if (rawSession) sessionForPatch = rawSession;
      }

      if (normalizedCard || ribbonColorUuid) {
        await patchOrderItemCustomizations(
          newItem.uuid,
          normalizedCard ?? undefined,
          ribbonColorUuid ?? undefined,
          sessionForPatch,
        );
      }

      resultItems.push({
        uuid: newItem.uuid,
        order_item_id: newItem.order_item_id,
        hasCard: !!normalizedCard,
        cardMessage: normalizedCard,
        ribbonColor: ribbonColorDisplay,
      });
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...relayCartCookie(latestSetCookie, '/api/cart'),
  };

  return new Response(JSON.stringify(resultItems), { status: 200, headers });
};
