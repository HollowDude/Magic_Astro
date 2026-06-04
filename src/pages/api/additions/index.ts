import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

interface AdditionProduct {
  id: string;
  variationId: number;
  variationUuid: string;
  title: string;
  price: string;
  priceNumber: number;
  thumbnailUrl: string | null;
}

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

export const GET: APIRoute = async ({ url }) => {
  const lang = url.searchParams.get('lang') ?? 'es';

  try {
    const path = `/jsonapi/commerce_product/addition?include=variations,variations.field_photo,variations.field_photo.field_media_image&page[limit]=20`;

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      lang,
      cacheTtl: 300_000,
    });

    if (raw.status !== 200) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      });
    }

    const data = raw.data as any;
    const products: Record<string, any>[] = data?.data ?? [];
    const included: Record<string, any>[] = data?.included ?? [];

    const incMap = new Map<string, Record<string, any>>();
    for (const inc of included) {
      incMap.set(`${inc.type}:${inc.id}`, inc);
    }

    const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');

    const result: AdditionProduct[] = [];

    for (const prod of products) {
      const attrs = prod?.attributes ?? {};
      if (attrs.status !== true) continue;

      const varData = prod?.relationships?.variations?.data?.[0];
      if (!varData) continue;

      const variation = incMap.get(`${varData.type}:${varData.id}`);
      if (!variation) continue;

      const varAttrs = variation?.attributes ?? {};
      if (varAttrs.status !== true) continue;

      const photoData = variation?.relationships?.field_photo?.data;
      let thumbnailUrl: string | null = null;
      if (photoData?.id) {
        const media = incMap.get(`media--image:${photoData.id}`);
        const fileData = media?.relationships?.field_media_image?.data;
        if (fileData?.id) {
          const file = incMap.get(`file--file:${fileData.id}`);
          const uriUrl = file?.attributes?.uri?.url;
          if (uriUrl) {
            thumbnailUrl = `${baseUrl}${uriUrl}`;
          }
        }
      }

      const price = varAttrs.price ?? {};
      result.push({
        id: prod.id,
        variationId: varAttrs.drupal_internal__variation_id,
        variationUuid: varData.id,
        title: varAttrs.title ?? prod?.attributes?.title ?? '',
        price: price.formatted ?? '',
        priceNumber: parseFloat(price.number ?? '0'),
        thumbnailUrl,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (e) {
    console.error('[additions] Error:', e);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
