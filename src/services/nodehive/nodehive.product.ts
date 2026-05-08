// src/services/nodehive/nodehive.product.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { getProductThumbnail, getVariationGallery } from '../../types/nodehive.commerce';
import type { FlowerProduct } from '../../types/nodehive.commerce';
import type { Lang } from '../../i18n/ui';

const dataFormatter = new Jsona();

const FLOWER_INCLUDES = [
  'variations',
  'variations.field_gallery_of_photos',
  'variations.field_gallery_of_photos.field_media_image',
  'variations.field_color',
  'field_category',
  'field_ocasion',
  'field_tag',
];

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept:         'application/vnd.api+json',
  },
} as const;

function buildBaseParams(p: DrupalJsonApiParams): void {
  p.addInclude(FLOWER_INCLUDES)
   .addFields('commerce_product--flower', [
     'title', 'body', 'field_description', 'field_category',
     'field_ocasion', 'field_tag', 'variations',
   ])
   .addFields('commerce_product_variation--flower', [
     'sku', 'price', 'title',
     'field_color',
     'field_gallery_of_photos',
     'field_type',
   ])
   .addFields('file--file',                      ['filename', 'uri', 'filemime'])
   .addFields('media--image',                    ['name', 'field_media_image'])
   .addFields('taxonomy_term--colors',           ['name', 'field_color_hex'])
   .addFields('taxonomy_term--flower_category',  ['name', 'drupal_internal__tid'])
   .addFields('taxonomy_term--occasions',        ['name'])
   .addFields('taxonomy_term--products_tag',     ['name']);
}

function buildListParams(p: DrupalJsonApiParams, limit: number): void {
  p.addFilter('status', '1').addPageLimit(limit);
  buildBaseParams(p);
}

// ── getProductById ────────────────────────────────────────────────────────────

export async function getProductById(id: string, lang?: Lang): Promise<FlowerProduct | null> {
  const params = new DrupalJsonApiParams();
  buildBaseParams(params);

  const path = `/jsonapi/commerce_product/flower/${id}?${params.getQueryString()}`;

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, { ...FETCH_OPTIONS, lang });
    if (raw.status !== 200) return null;

    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result[0] : result) as FlowerProduct;
  } catch {
    return null;
  }
}

// ── getRelatedProducts ────────────────────────────────────────────────────────

/**
 * Obtiene productos relacionados en paralelo:
 * 1. Por categoría Y por color simultáneamente.
 * 2. Merge con deduplicación (categoría tiene prioridad).
 * 3. Fallback a recientes si no hay suficientes.
 */
export async function getRelatedProducts(
  product: FlowerProduct,
  lang?: Lang,
  limit = 4,
): Promise<FlowerProduct[]> {
  const categoryId = product.field_category?.id;
  const colorName  = product.variations?.[0]?.field_color?.name;

  // ── Fetch paralelo de las dos fuentes principales ─────────────────────────
  const [byCategory, byColor] = await Promise.all([
    categoryId
      ? fetchRelatedByFilter('field_category.id', categoryId, product.id, lang, limit)
      : Promise.resolve([]),
    colorName
      ? fetchRelatedByFilter(
          'variations.field_color.name', colorName, product.id, lang, limit,
        )
      : Promise.resolve([]),
  ]);

  // Merge: categoría primero, luego color (dedupe elimina duplicados)
  const merged = dedupe([...byCategory, ...byColor], product.id);
  if (merged.length >= limit) return merged.slice(0, limit);

  // ── Fallback: recientes ───────────────────────────────────────────────────
  const latest = await fetchLatestProducts(product.id, lang, limit);
  return dedupe([...merged, ...latest], product.id).slice(0, limit);
}

// ── getProductDetailPageData ──────────────────────────────────────────────────

/**
 * Encapsula toda la lógica de obtención de datos para la página de detalle.
 * Retorna null si el producto no existe (la página puede redirigir).
 */
export async function getProductDetailPageData(
  id: string,
  lang: Lang,
): Promise<{
  productTitle:    string;
  productData:     {
    id: string; title: string; price: string; description: string;
    images: string[]; badge: null; tipo: string | null;
    colorName: string | null; colorHex: string | null; category: string | null;
  };
  relatedProducts: Array<{
    id: string; title: string; price: string; priceNumber: number;
    thumbnail: string | null; badge: null; tipo: string | null;
    colorName: string | null; colorHex: string | null; category: string | null;
  }>;
} | null> {
  const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

  const product = await getProductById(id, lang);
  if (!product) return null;

  const variation = product.variations?.[0];
  const allImages = variation ? getVariationGallery(variation, NODEHIVE_BASE_URL) : [];

  const productData = {
    id:          product.id,
    title:       product.title,
    price:       variation?.price?.formatted                   ?? '',
    description: product.body?.processed ?? product.field_description ?? '',
    images:      allImages,
    badge:       null as null,
    tipo:        variation?.field_type                         ?? null,
    colorName:   variation?.field_color?.name                  ?? null,
    colorHex:    variation?.field_color?.field_color_hex       ?? null,
    category:    product.field_category?.name                  ?? null,
  };

  const rawRelated = await getRelatedProducts(product, lang, 4);

  const relatedProducts = rawRelated.map(p => {
    const v = p.variations?.[0];
    return {
      id:          p.id,
      title:       p.title,
      price:       v?.price?.formatted                   ?? '',
      priceNumber: parseFloat(v?.price?.number          ?? '0'),
      thumbnail:   getProductThumbnail(p, NODEHIVE_BASE_URL),
      badge:       null as null,
      tipo:        v?.field_type                         ?? null,
      colorName:   v?.field_color?.name                  ?? null,
      colorHex:    v?.field_color?.field_color_hex       ?? null,
      category:    p.field_category?.name                ?? null,
    };
  });

  return { productTitle: product.title, productData, relatedProducts };
}

// ── Helpers internos ──────────────────────────────────────────────────────────

async function fetchRelatedByFilter(
  filterPath: string,
  filterValue: string,
  excludeId: string,
  lang?: Lang,
  limit = 4,
): Promise<FlowerProduct[]> {
  const params = new DrupalJsonApiParams();
  buildListParams(params, limit + 1);
  params.addFilter(filterPath, filterValue);

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/commerce_product/flower?${params.getQueryString()}`,
      { ...FETCH_OPTIONS, lang },
    );
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(
      Array.isArray(all) ? (all as FlowerProduct[]) : [all as FlowerProduct],
      excludeId,
    );
  } catch {
    return [];
  }
}

async function fetchLatestProducts(
  excludeId: string,
  lang?: Lang,
  limit = 4,
): Promise<FlowerProduct[]> {
  const params = new DrupalJsonApiParams();
  buildListParams(params, limit + 1);

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/commerce_product/flower?${params.getQueryString()}`,
      { ...FETCH_OPTIONS, lang },
    );
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(
      Array.isArray(all) ? (all as FlowerProduct[]) : [all as FlowerProduct],
      excludeId,
    );
  } catch {
    return [];
  }
}

function dedupe(products: FlowerProduct[], excludeId: string): FlowerProduct[] {
  const seen = new Set<string>([excludeId]);
  return products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}