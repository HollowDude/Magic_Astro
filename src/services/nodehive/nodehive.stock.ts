import { nodehiveFetch } from './nodehive.client';

export async function getVariationStockByInternalId(
  variationIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  const uniqueIds = [...new Set(variationIds)].filter(Boolean);
  if (uniqueIds.length === 0) return map;

  const valueParams = uniqueIds
    .map(id => `filter[vid][condition][value][]=${encodeURIComponent(String(id))}`)
    .join('&');
  const path =
    `/jsonapi/commerce_product_variation/flower` +
    `?fields[commerce_product_variation--flower]=drupal_internal__variation_id,field_stock` +
    `&filter[vid][condition][path]=drupal_internal__variation_id` +
    `&filter[vid][condition][operator]=IN&${valueParams}`;

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      cacheTtl: 0,
    });
    if (raw.status !== 200) return map;

    const data = raw.data as any;
    for (const item of data?.data ?? []) {
      const internalId = item?.attributes?.drupal_internal__variation_id;
      const stock = item?.attributes?.field_stock;
      if (typeof internalId === 'number') {
        map.set(internalId, Math.max(0, typeof stock === 'number' ? stock : 0));
      }
    }
  } catch (e) {
    console.error('[stock] getVariationStockByInternalId error:', e);
  }

  return map;
}

export async function getSingleVariationStock(variationId: number): Promise<number> {
  const map = await getVariationStockByInternalId([variationId]);
  return map.get(variationId) ?? 0;
}
