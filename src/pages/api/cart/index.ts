import type { APIRoute } from 'astro';
import { getCart, fetchRibbonColors, ribbonColorDefFromUuid, type CartOrder, type CustomizationEntry } from '@/services/nodehive/nodehive.cart';
import type { RibbonColorDef } from '@/services/nodehive/nodehive.cart';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { getSession } from '@/services/session.service';
import { relayCartCookie } from './cookie-helper';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

interface RibbonColorInfo {
  name: string;
  hex: string;
}

interface AdditionDisplay {
  orderItemId: number;
  title: string;
  unitPrice: string;
  totalPrice: string;
  quantity: number;
  thumbnailUrl: string | null;
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
  additions: AdditionDisplay[];
  isAddition: boolean;
}

interface CartApiResponse {
  items: CartItemDisplay[];
  totalItems: number;
  totalPrice: string;
  hasActiveCheckout?: boolean;
  activeCheckoutOrderUuid?: string;
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

async function getAdditionThumbnailMap(uuids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (uuids.length === 0) return map;

  const params = new URLSearchParams();
  params.set('include', 'field_photo,field_photo.field_media_image');
  const valueParams = uuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');
  const path = `/jsonapi/commerce_product_variation/addition?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}&${params.toString()}`;

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

      const rels = item?.relationships?.field_photo?.data;
      const mediaId = rels?.id;
      if (!mediaId) continue;

      const mediaEntity = included.find((inc: any) => inc.type === 'media--image' && inc.id === mediaId);
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

async function fetchAdditionsData(
  orderUuids: string[],
  additionByProductId: Map<number, number>,
  drupalSession?: string,
  accessToken?: string,
): Promise<Map<number, AdditionDisplay[]>> {
  const additionsByParentId = new Map<number, AdditionDisplay[]>();
  if (orderUuids.length === 0 || additionByProductId.size === 0) return additionsByParentId;

  try {
    const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');
    const valueParams = orderUuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');
    const url = `${baseUrl}/en/jsonapi/commerce_order/default?include=order_items,order_items.field_additions&fields[commerce_order--default]=drupal_internal__order_id&fields[commerce_order_item--default]=drupal_internal__order_item_id,title,quantity,unit_price,total_price,purchased_entity,field_additions&fields[commerce_product--addition]=drupal_internal__product_id,title&filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (drupalSession) {
      headers['Cookie'] = drupalSession;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) return additionsByParentId;

    const json = await res.json();
    const included = json?.included ?? [];

    // Build order item map by internal ID
    const orderItemById = new Map<number, Record<string, any>>();
    for (const entry of included) {
      if (entry?.type !== 'commerce_order_item--default') continue;
      const internalId = entry?.attributes?.drupal_internal__order_item_id;
      if (!internalId) continue;
      orderItemById.set(internalId, entry);
    }

    // For each order item with field_additions, match addition items by product_id
    for (const entry of included) {
      if (entry?.type !== 'commerce_order_item--default') continue;
      const internalId = entry?.attributes?.drupal_internal__order_item_id;
      if (!internalId) continue;

      const addRelData = entry?.relationships?.field_additions?.data;
      if (!Array.isArray(addRelData) || addRelData.length === 0) continue;

      const parentAdditions: AdditionDisplay[] = [];
      for (const addRef of addRelData) {
        const targetPid = addRef.meta?.drupal_internal__target_id;
        if (!targetPid) continue;

        const addOiId = additionByProductId.get(targetPid);
        if (!addOiId) continue;

        const addEntry = orderItemById.get(addOiId);
        if (!addEntry) continue;

        parentAdditions.push({
          orderItemId: addOiId,
          title: addEntry?.attributes?.title ?? '',
          unitPrice: addEntry?.attributes?.unit_price?.formatted ?? '',
          totalPrice: addEntry?.attributes?.total_price?.formatted ?? '',
          quantity: parseFloat(addEntry?.attributes?.quantity ?? '0') || 0,
          thumbnailUrl: null,
        });
      }

      if (parentAdditions.length > 0) {
        additionsByParentId.set(internalId, parentAdditions);
      }
    }
  } catch (e) {
    console.error('[cart] fetchAdditionsData error:', e);
  }

  return additionsByParentId;
}

async function fetchCustomizations(
  orderUuids: string[],
  ribbonColors: RibbonColorDef[],
  drupalSession?: string,
  accessToken?: string,
): Promise<Record<number, CustomizationEntry>> {
  if (orderUuids.length === 0) return {};

  try {
    const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');
    const valueParams = orderUuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');
    const url = `${baseUrl}/en/jsonapi/commerce_order/default?include=order_items&fields[commerce_order--default]=drupal_internal__order_id&filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (drupalSession) {
      headers['Cookie'] = drupalSession;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      return {};
    }

    const json = await res.json();
    const included = json?.included ?? [];

    const map: Record<number, CustomizationEntry> = {};
    for (const entry of included) {
      if (entry?.type !== 'commerce_order_item--default') continue;
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
    if (Object.keys(map).length === 0) {
      console.warn('[cart] fetchCustomizations: all items omitted due to JSON:API permissions.');
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
  const session = await getSession(cookies);
  const accessToken = session?.accessToken;
  const result = await getCart(decoded);

  const rawCarts = Array.isArray(result.data) ? (result.data as CartOrder[]) : [];

  const baseUrl = (import.meta.env.NODEHIVE_BASE_URL as string).replace(/\/+$/, '');

  async function hasCheckoutStartedOnDrupal(): Promise<{
    started: boolean;
    orderUuid: string | null;
  }> {
    if (rawCarts.length === 0) return { started: false, orderUuid: null };

    const orderIds = rawCarts.map(c => c.order_id);
    const valueParams = orderIds.map(id =>
      `filter[drupal_internal__order_id][condition][value][]=${encodeURIComponent(String(id))}`,
    ).join('&');
    const qs = `fields[commerce_order--default]=drupal_internal__order_id,field_checkout_started&filter[drupal_internal__order_id][condition][path]=drupal_internal__order_id&filter[drupal_internal__order_id][condition][operator]=IN&${valueParams}`;

    try {
      const res = await fetch(
        `${baseUrl}/en/jsonapi/commerce_order/default?${qs}`,
        {
          headers: {
            Accept: 'application/vnd.api+json',
            ...(decoded
              ? { Cookie: decoded }
              : {}),
          },
        },
      );
      if (!res.ok) return { started: false, orderUuid: null };
      const json = await res.json();
      const orders = Array.isArray(json?.data) ? json.data : [];
      for (const order of orders) {
        if (order?.attributes?.field_checkout_started === true) {
          return { started: true, orderUuid: order.id };
        }
      }
    } catch {}
    return { started: false, orderUuid: null };
  }

  const checkoutInfo = await hasCheckoutStartedOnDrupal();

  if (checkoutInfo.started) {
    const response: CartApiResponse = {
      items: [],
      totalItems: 0,
      totalPrice: '',
      hasActiveCheckout: true,
      activeCheckoutOrderUuid: checkoutInfo.orderUuid ?? '',
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...relayCartCookie(result.headers, drupalSession),
    };
    return new Response(JSON.stringify(response), { status: 200, headers });
  }

  const activeCarts = rawCarts;

  const variationUuids = new Set<string>();
  const orderUuids: string[] = [];
  for (const cart of activeCarts) {
    for (const item of cart.order_items ?? []) {
      const vuuid = item.purchased_entity?.uuid;
      if (vuuid) variationUuids.add(vuuid);
    }
    if (cart.uuid) orderUuids.push(cart.uuid);
  }

  // Identify addition items directly from the cart response
  const additionItemIdSet = new Set<number>();
  const additionVariationUuids = new Set<string>();
  const additionByProductId = new Map<number, number>();
  for (const cart of activeCarts) {
    for (const item of cart.order_items ?? []) {
      if (item.purchased_entity?.type === 'addition') {
        additionItemIdSet.add(item.order_item_id);
        if (item.purchased_entity?.uuid) {
          additionVariationUuids.add(item.purchased_entity.uuid);
        }
        if (item.purchased_entity?.product_id) {
          additionByProductId.set(item.purchased_entity.product_id, item.order_item_id);
        }
      }
    }
  }

  const ribbonColors = await fetchRibbonColors();

  const [thumbnailMap, customizationMap, additionsByParentId] = await Promise.all([
    getVariationThumbnailMap(Array.from(variationUuids)),
    fetchCustomizations(orderUuids, ribbonColors, decoded, accessToken),
    fetchAdditionsData(orderUuids, additionByProductId, decoded, accessToken),
  ]);

  // Fetch addition variation thumbnails
  let additionThumbnailMap = new Map<string, string>();
  if (additionVariationUuids.size > 0) {
    additionThumbnailMap = await getAdditionThumbnailMap(Array.from(additionVariationUuids));
  }

  const items: CartItemDisplay[] = activeCarts.flatMap(cart =>
    (cart.order_items ?? []).map(item => {
      const cust = customizationMap[item.order_item_id];
      const parentAdditions = additionsByParentId.get(item.order_item_id) ?? [];

      // Resolve thumbnails for parent additions
      const resolvedAdditions = parentAdditions.map(add => ({
        ...add,
        thumbnailUrl: additionThumbnailMap.get(
          cart.order_items.find((oi: any) => oi.order_item_id === add.orderItemId)
            ?.purchased_entity?.uuid ?? '',
        ) ?? null,
      }));

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
        additions: resolvedAdditions,
        isAddition: additionItemIdSet.has(item.order_item_id),
      };
    }),
  );

  const totalItems = items.reduce((sum, i) => sum + (i.isAddition ? 0 : i.quantity), 0);
  const totalPrice = activeCarts[0]?.total_price?.formatted ?? '';

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
