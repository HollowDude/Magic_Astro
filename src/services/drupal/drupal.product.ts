// src/services/drupal/drupal.product.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import { getProductThumbnail, getVariationGallery } from '@/types/commerce';
import type { FloresProduct } from '@/types/commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

const FLORES_INCLUDES = [
  'variations',
  'variations.field_galeria_de_fotos',
  'variations.field_color_de_la_flor',
  'field_categoria',
];

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept:         'application/vnd.api+json',
  },
} as const;

function buildBaseParams(p: DrupalJsonApiParams): void {
  p.addInclude(FLORES_INCLUDES)
   .addFields('commerce_product--flores', ['title', 'body', 'variations', 'field_categoria'])
   .addFields('commerce_product_variation--flores_personalizadas', [
     'sku', 'price', 'title',
     'field_color_de_la_flor',
     'field_galeria_de_fotos',
     'field_tipo',
   ])
   .addFields('file--file',                          ['filename', 'uri', 'filemime'])
   .addFields('taxonomy_term--colores',               ['name', 'field_color_hex'])
   .addFields('taxonomy_term--categorias_de_flores',  ['name']);
}

function buildListParams(p: DrupalJsonApiParams, limit: number): void {
  p.addFilter('status', '1').addPageLimit(limit);
  buildBaseParams(p);
}

// ── getProductById ────────────────────────────────────────────────────────────

export async function getProductById(id: string, lang?: Lang): Promise<FloresProduct | null> {
  const params = new DrupalJsonApiParams();
  buildBaseParams(params);

  const path = `/jsonapi/commerce_product/flores/${id}?${params.getQueryString()}`;

  try {
    const raw = await drupalFetch<Record<string, unknown>>(path, { ...FETCH_OPTIONS, lang });
    if (raw.status !== 200) return null;

    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result[0] : result) as FloresProduct;
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
  product: FloresProduct,
  lang?: Lang,
  limit = 4,
): Promise<FloresProduct[]> {
  const categoryId = (product as any).field_categoria?.id as string | undefined;
  const colorName  = product.variations?.[0]?.field_color_de_la_flor?.name;

  // ── Fetch paralelo de las dos fuentes principales ─────────────────────────
  const [byCategory, byColor] = await Promise.all([
    categoryId
      ? fetchRelatedByFilter('field_categoria.id', categoryId, product.id, lang, limit)
      : Promise.resolve([]),
    colorName
      ? fetchRelatedByFilter(
          'variations.field_color_de_la_flor.name', colorName, product.id, lang, limit,
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
  const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL as string;

  const product = await getProductById(id, lang);
  if (!product) return null;

  const variation = product.variations?.[0];
  const allImages = variation ? getVariationGallery(variation, DRUPAL_BASE_URL) : [];

  const productData = {
    id:          product.id,
    title:       product.title,
    price:       variation?.price?.formatted                        ?? '',
    description: product.body?.processed                           ?? '',
    images:      allImages,
    badge:       null as null,  // se computa en ProductDetailContent.astro con t()
    tipo:        variation?.field_tipo                              ?? null,
    colorName:   variation?.field_color_de_la_flor?.name           ?? null,
    colorHex:    variation?.field_color_de_la_flor?.field_color_hex ?? null,
    category:    (product as any).field_categoria?.name            ?? null,
  };

  // getRelatedProducts ya es paralelo internamente
  const rawRelated = await getRelatedProducts(product, lang, 4);

  const relatedProducts = rawRelated.map(p => {
    const v = p.variations?.[0];
    return {
      id:          p.id,
      title:       p.title,
      price:       v?.price?.formatted                        ?? '',
      priceNumber: parseFloat(v?.price?.number               ?? '0'),
      thumbnail:   getProductThumbnail(p, DRUPAL_BASE_URL),
      badge:       null as null,
      tipo:        v?.field_tipo                              ?? null,
      colorName:   v?.field_color_de_la_flor?.name           ?? null,
      colorHex:    v?.field_color_de_la_flor?.field_color_hex ?? null,
      category:    (p as any).field_categoria?.name          ?? null,
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
): Promise<FloresProduct[]> {
  const params = new DrupalJsonApiParams();
  buildListParams(params, limit + 1);
  params.addFilter(filterPath, filterValue);

  try {
    const raw = await drupalFetch<Record<string, unknown>>(
      `/jsonapi/commerce_product/flores?${params.getQueryString()}`,
      { ...FETCH_OPTIONS, lang },
    );
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(
      Array.isArray(all) ? (all as FloresProduct[]) : [all as FloresProduct],
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
): Promise<FloresProduct[]> {
  const params = new DrupalJsonApiParams();
  buildListParams(params, limit + 1);

  try {
    const raw = await drupalFetch<Record<string, unknown>>(
      `/jsonapi/commerce_product/flores?${params.getQueryString()}`,
      { ...FETCH_OPTIONS, lang },
    );
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(
      Array.isArray(all) ? (all as FloresProduct[]) : [all as FloresProduct],
      excludeId,
    );
  } catch {
    return [];
  }
}

function dedupe(products: FloresProduct[], excludeId: string): FloresProduct[] {
  const seen = new Set<string>([excludeId]);
  return products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}