/**
 * GET /api/search?q=query&lang=es|en
 *
 * Busca productos commerce de tipo "flores" cuyo título contenga la cadena.
 * Devuelve los primeros 4 resultados (3 para mostrar + 1 para saber si hay más).
 *
 * Respuestas:
 *   200  { results: SearchResult[], hasMore: boolean }
 *   400  { results: [], hasMore: false }   — query < 3 caracteres
 */

import type { APIRoute } from 'astro';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { getProductThumbnail } from '@/types/nodehive';
import type { FloresProduct } from '@/types/nodehive';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

// ── Tipo público ──────────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  title: string;
  price: string;
  thumbnail: string | null;
}

// ── Límite real de fetch: 4 (3 a mostrar + 1 para saber si hay más) ───────────
const FETCH_LIMIT = 4;
const DISPLAY_LIMIT = 3;

export const GET: APIRoute = async ({ url }) => {
  const q    = url.searchParams.get('q')?.trim() ?? '';
  const lang = (url.searchParams.get('lang') ?? 'es') as 'es' | 'en';

  if (q.length < 1) {
    return jsonOk({ results: [], hasMore: false });
  }

  const apiParams = new DrupalJsonApiParams();

    apiParams
      .addFilter('status', '1')
      .addFilter('title', q, 'CONTAINS')
      .addPageLimit(FETCH_LIMIT)
      .addInclude([
        'variations',
        'variations.field_gallery_of_photos',
        'variations.field_gallery_of_photos.field_media_image',
      ])
      .addFields('commerce_product--flower', ['title', 'variations'])
      .addFields('commerce_product_variation--flower', [
        'price',
        'title',
        'field_gallery_of_photos',
      ])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri', 'filemime']);

  const path = `/jsonapi/commerce_product/flower?${apiParams.getQueryString()}`;

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
      lang,
    });

    if (raw.status !== 200) {
      return jsonOk({ results: [], hasMore: false });
    }

    const all = dataFormatter.deserialize(raw.data) as FloresProduct[];
    const products = Array.isArray(all) ? all : [all];

    const hasMore = products.length > DISPLAY_LIMIT;
    const slice   = products.slice(0, DISPLAY_LIMIT);

    const results: SearchResult[] = slice.map((p) => ({
      id:        p.id,
      title:     p.title,
      price:     p.variations?.[0]?.price?.formatted ?? '',
      thumbnail: getProductThumbnail(p, NODEHIVE_BASE_URL),
    }));

    return jsonOk({ results, hasMore });

  } catch (err) {
    console.error('[Search API] Error:', err);
    return jsonOk({ results: [], hasMore: false });
  }
};

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status:  200,
    headers: { 'Content-Type': 'application/json' },
  });
}