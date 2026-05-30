import type { APIRoute } from 'astro';
import { getCart, fetchRibbonColors, ribbonColorDefFromUuid, type CartOrder, type CustomizationEntry } from '@/services/nodehive/nodehive.cart';
import type { RibbonColorDef } from '@/services/nodehive/nodehive.cart';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { relayCartCookie } from './cookie-helper';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

interface RibbonColorInfo {
  name: string;
  hex: string;
}

interface CartItemDisplay {
  itemId: number;
  orderId: number;
  variationId: number | null;
  title: string;
  sku: string;
  price: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  thumbnailUrl: string | null;
  hasCard: boolean;
  cardMessage: string | null;
  ribbonColor: RibbonColorInfo | null;
}

interface CartApiResponse {
  items: CartItemDisplay[];
  totalItems: number;
  totalPrice: string;
}

async function getVariationThumbnailMap(uuids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (uuids.length === 0) return map;

  const params = new URLSearchParams();
  params.set('include', 'field_gallery_of_photos,field_gallery_of_photos.field_media_image');
  const valueParams = uuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');
  const path = `/jsonapi/commerce_product_variation/flower?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}&${params.toString()}`;

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      skipApiKey: false,
      cacheTtl: 60_000,
    });
    if (raw.status !== 200) return map;

    const data = raw.data as any;
    const included: Array<Record<string, any>> = data?.included ?? [];

    for (const item of data?.data ?? []) {
      const itemUuid = item?.id;
      if (!itemUuid) continue;

      const rels = item?.relationships?.field_gallery_of_photos?.data ?? [];
      const firstMediaId = rels[0]?.id;
      if (!firstMediaId) continue;

      const mediaEntity = included.find((inc: any) => inc.type === 'media--image' && inc.id === firstMediaId);
      const fileId = mediaEntity?.relationships?.field_media_image?.data?.id;
      if (!fileId) continue;

      const fileEntity = included.find((inc: any) => inc.type === 'file--file' && inc.id === fileId);
      const uri = fileEntity?.attributes?.uri?.url;
      if (uri) {
        const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');
        map.set(itemUuid, `${baseUrl}${uri}`);
      }
    }
  } catch {
    // silent fail
  }

  return map;
}

async function fetchCustomizations(
  itemUuids: string[],
  ribbonColors: RibbonColorDef[],
): Promise<Record<number, CustomizationEntry>> {
  if (itemUuids.length === 0) return {};

  try {
    const valueParams = itemUuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');
    const path = `/jsonapi/commerce_order_item/default?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}`;
    const result = await nodehiveFetch<{ data: Array<Record<string, any>> }>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      skipApiKey: false,
      cacheTtl: 0,
    });

    if (result.status !== 200) {
      console.error(`[cart] fetchCustomizations returned ${result.status}`, result.data);
      return {};
    }

    const map: Record<number, CustomizationEntry> = {};
    for (const entry of result.data?.data ?? []) {
      const internalId = entry?.attributes?.drupal_internal__order_item_id;
      if (!internalId) continue;
      const attrs = entry?.attributes ?? {};
      const relData = entry?.relationships?.field_ribbon_color?.data;
      let ribbonColor = null;
      if (relData?.id) {
        ribbonColor = ribbonColorDefFromUuid(relData.id, ribbonColors);
      }
      map[internalId] = {
        hasCard: attrs.field_has_card ?? false,
        cardMessage: attrs.field_card_message ?? null,
        ribbonColor,
        ribbonColorUuid: relData?.id ?? null,
      };
    }
    return map;
  } catch (e) {
    console.error('[cart] fetchCustomizations error:', e);
    return {};
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  const drupalSession = cookies.get('drupal_s')?.value;
  const decoded = drupalSession ? decodeURIComponent(drupalSession) : undefined;
  const result = await getCart(decoded);

  const rawCarts = result.data as CartOrder[];

  const variationUuids = new Set<string>();
  const itemUuids: string[] = [];
  for (const cart of rawCarts) {
    for (const item of cart.order_items ?? []) {
      const vuuid = item.purchased_entity?.uuid;
      if (vuuid) variationUuids.add(vuuid);
      if (item.uuid) itemUuids.push(item.uuid);
    }
  }

  const ribbonColors = await fetchRibbonColors();

  const [thumbnailMap, customizationMap] = await Promise.all([
    getVariationThumbnailMap(Array.from(variationUuids)),
    fetchCustomizations(itemUuids, ribbonColors),
  ]);

  const items: CartItemDisplay[] = rawCarts.flatMap(cart =>
    (cart.order_items ?? []).map(item => {
      const cust = customizationMap[item.order_item_id];
      return {
        itemId: item.order_item_id,
        orderId: cart.order_id,
        variationId: item.purchased_entity?.variation_id ?? null,
        title: item.title,
        sku: item.purchased_entity?.sku ?? '',
        price: item.unit_price?.formatted ?? '',
        unitPrice: item.unit_price?.number ?? '',
        quantity: parseFloat(item.quantity) || 0,
        totalPrice: item.total_price?.formatted ?? '',
        thumbnailUrl: thumbnailMap.get(item.purchased_entity?.uuid ?? '') ?? null,
        hasCard: cust?.hasCard ?? false,
        cardMessage: cust?.cardMessage ?? null,
        ribbonColor: cust?.ribbonColor ?? null,
      };
    }),
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = rawCarts[0]?.total_price?.formatted ?? '';

  const response: CartApiResponse = { items, totalItems, totalPrice };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...relayCartCookie(result.headers, drupalSession),
  };

  return new Response(JSON.stringify(response), { status: 200, headers });
};
