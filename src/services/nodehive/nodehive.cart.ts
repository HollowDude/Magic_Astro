import { nodehiveFetch } from './nodehive.client';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

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
  });
  return { data: result.data, headers: result.headers };
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
  return { data: result.data, headers: result.headers };
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

export const RIBBON_COLOR_MAP: Record<string, { name: string; hex: string }> = {
  'd8987a10-0db1-42bf-aa13-1da1c14b1870': { name: 'Red', hex: '#c0392b' },
  'e615fc4b-9caf-4b4d-9d3c-5f31d2a55a44': { name: 'Yellow', hex: '#d4ac0d' },
  '504b04ad-e74c-4f03-ade1-c5d4ce0af999': { name: 'Gray', hex: '#a8a9ad' },
  'afe8e4c1-d329-4cb2-807e-78e2065ec451': { name: 'White', hex: '#ffffff' },
};

export interface CustomizationEntry {
  hasCard: boolean;
  cardMessage: string | null;
  ribbonColor: { name: string; hex: string } | null;
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
