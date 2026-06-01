// src/services/nodehive/nodehive.shipping.ts
import { nodehiveFetch } from './nodehive.client';

export interface ShippingConfig {
  deliveryPrice: number;
  deliveryCurrency: string;
  deliveryLabel: string;
  deliveryTime: string;
  pickupLabel: string;
  pickupTime: string;
  pickupAddress: string;
  pickupPrice: number;
}

const FALLBACK: ShippingConfig = {
  deliveryPrice: 24.00,
  deliveryCurrency: 'USD',
  deliveryLabel: 'Delivery a domicilio',
  deliveryTime: '1 a 3 días hábiles',
  pickupLabel: 'Recogida en tienda',
  pickupTime: 'Disponible en 24 horas',
  pickupAddress: 'Av. Principal Las Mercedes, Local 4B',
  pickupPrice: 0,
};

export async function getShippingConfig(lang: string = 'es'): Promise<ShippingConfig> {
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/nodehive_fragment/shipping_config?page[limit]=1`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
        cacheTtl: 60_000,
      },
    );
    if (raw.status !== 200) return FALLBACK;
    const rawItem = (raw.data as any)?.data?.[0] ?? null;
    if (!rawItem) return FALLBACK;
    const attrs = rawItem.attributes ?? {};

    return {
      deliveryPrice: parseFloat(attrs.field_delivery_price ?? '24') || 24,
      deliveryCurrency: attrs.field_delivery_currency ?? 'USD',
      deliveryLabel: attrs.field_delivery_label ?? FALLBACK.deliveryLabel,
      deliveryTime: attrs.field_delivery_time ?? FALLBACK.deliveryTime,
      pickupLabel: attrs.field_pickup_label ?? FALLBACK.pickupLabel,
      pickupTime: attrs.field_pickup_time ?? FALLBACK.pickupTime,
      pickupAddress: attrs.field_pickup_address ?? FALLBACK.pickupAddress,
      pickupPrice: parseFloat(attrs.field_pickup_price ?? '0') || 0,
    };
  } catch {
    return FALLBACK;
  }
}
