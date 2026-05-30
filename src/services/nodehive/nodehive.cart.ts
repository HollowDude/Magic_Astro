import { nodehiveFetch } from './nodehive.client';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

export interface RibbonColorDef {
  uuid: string;
  name: string;
  hex: string;
}

const RIBBON_COLOR_HEX_BY_NAME: Record<string, string> = {
  red: '#c0392b',
  yellow: '#d4ac0d',
  gray: '#a8a9ad',
  grey: '#a8a9ad',
  white: '#ffffff',
};

let _ribbonColorsCache: { data: RibbonColorDef[]; expiresAt: number } | null = null;
const RIBBON_CACHE_TTL = 300_000;

export async function fetchRibbonColors(): Promise<RibbonColorDef[]> {
  if (_ribbonColorsCache && Date.now() < _ribbonColorsCache.expiresAt) {
    return _ribbonColorsCache.data;
  }

  try {
    const result = await nodehiveFetch<{ data: Array<Record<string, any>> }>(
      '/jsonapi/taxonomy_term/ribbon_color',
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        cacheTtl: 0,
      },
    );

    if (result.status !== 200) throw new Error(`HTTP ${result.status}`);

    const colors: RibbonColorDef[] = (result.data?.data ?? []).map((entry: any) => {
      const name = entry?.attributes?.name ?? 'Unknown';
      const nameLower = name.toLowerCase();
      return {
        uuid: entry.id,
        name,
        hex: RIBBON_COLOR_HEX_BY_NAME[nameLower] ?? '#cccccc',
      };
    });

    _ribbonColorsCache = { data: colors, expiresAt: Date.now() + RIBBON_CACHE_TTL };
    return colors;
  } catch (e) {
    if (_ribbonColorsCache) return _ribbonColorsCache.data;
    return [];
  }
}

export function clearRibbonColorsCache(): void {
  _ribbonColorsCache = null;
}

export async function resolveRibbonColorUuid(name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const colors = await fetchRibbonColors();
  const found = colors.find(c => c.name.toLowerCase() === name.toLowerCase());
  return found?.uuid ?? null;
}

export function ribbonColorDefFromUuid(uuid: string | null | undefined, colors: RibbonColorDef[]): { name: string; hex: string } | null {
  if (!uuid) return null;
  const found = colors.find(c => c.uuid === uuid);
  return found ? { name: found.name, hex: found.hex } : null;
}

export interface PurchasedEntity {
  variation_id: number;
  uuid: string;
  type: string;
  product_id: number;
  sku: string;
  title: string;
  price: {
    number: string;
    currency_code: string;
    formatted: string;
  };
  field_color: number | null;
  field_gallery_of_photos: number[];
  field_type: string | null;
}

export interface CartOrderItem {
  order_item_id: number;
  uuid: string;
  order_id: number;
  purchased_entity: PurchasedEntity;
  title: string;
  quantity: string;
  unit_price: {
    number: string;
    currency_code: string;
    formatted: string;
  };
  total_price: {
    number: string;
    currency_code: string;
    formatted: string;
  };
  locked: boolean;
}

export interface CartOrder {
  order_id: number;
  uuid: string;
  order_number: string | null;
  store_id: number;
  order_items: CartOrderItem[];
  total_price: {
    number: string;
    currency_code: string;
    formatted: string;
  };
}

export interface CartResult {
  data: CartOrder[];
  headers: Headers;
}

export interface AddToCartResult {
  data: CartOrderItem[];
  headers: Headers;
}

export interface UpdateItemResult {
  data: CartOrderItem | null;
  headers: Headers;
}

function cartHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function getCart(cookie?: string): Promise<CartResult> {
  const result = await nodehiveFetch<CartOrder[]>('/cart?_format=json', {
    method: 'GET',
    headers: cartHeaders(),
    sessionCookie: cookie,
    skipApiKey: true,
    cacheTtl: 0,
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return { data, headers: result.headers };
}

export async function addToCart(
  items: Array<{
    purchased_entity_type: string;
    purchased_entity_id: number;
    quantity: number;
    combine?: boolean;
  }>,
  cookie?: string,
): Promise<AddToCartResult> {
  const result = await nodehiveFetch<CartOrderItem[]>('/cart/add', {
    method: 'POST',
    body: items,
    headers: cartHeaders(),
    sessionCookie: cookie,
    skipApiKey: true,
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return { data, headers: result.headers };
}

export async function updateCartItem(
  orderId: number,
  itemId: number,
  quantity: number,
  cookie?: string,
): Promise<UpdateItemResult> {
  const result = await nodehiveFetch<CartOrderItem>(`/cart/${orderId}/items/${itemId}?_format=json`, {
    method: 'PATCH',
    body: { quantity },
    headers: cartHeaders(),
    sessionCookie: cookie,
    skipApiKey: true,
  });
  return { data: result.data, headers: result.headers };
}

export async function removeCartItem(
  orderId: number,
  itemId: number,
  cookie?: string,
): Promise<{ success: boolean; headers: Headers }> {
  const result = await nodehiveFetch<unknown>(`/cart/${orderId}/items/${itemId}?_format=json`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    sessionCookie: cookie,
    skipApiKey: true,
  });
  return { success: result.status === 200 || result.status === 204, headers: result.headers };
}

export interface CustomizationEntry {
  hasCard: boolean;
  cardMessage: string | null;
  ribbonColor: { name: string; hex: string } | null;
  ribbonColorUuid: string | null;
}

export async function clearCart(
  orderId: number,
  cookie?: string,
): Promise<{ success: boolean; headers: Headers }> {
  const result = await nodehiveFetch<unknown>(`/cart/${orderId}/items?_format=json`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    sessionCookie: cookie,
    skipApiKey: true,
  });
  return { success: result.status === 200 || result.status === 204, headers: result.headers };
}
