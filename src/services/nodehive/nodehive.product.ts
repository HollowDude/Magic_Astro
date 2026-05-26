// src/services/nodehive/nodehive.product.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { getProductThumbnail, getVariationGallery } from '@/types/nodehive';
import type { FlowerProduct } from '@/types/nodehive';
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
      'drupal_internal__variation_id',
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
 * Obtiene productos relacionados:
 * Solo por categoría. Si no hay suficientes, retorna los que haya (0 si no coincide ninguno).
 */
export async function getRelatedProducts(
  product: FlowerProduct,
  lang?: Lang,
  limit = 4,
): Promise<FlowerProduct[]> {
  const categoryId = product.field_category?.id;

  if (!categoryId) return [];

  return fetchRelatedByFilter('field_category.id', categoryId, product.id, lang, limit);
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
    images: string[]; badge: null; tag: string | null; tipo: string | null;
    colorName: string | null; colorHex: string | null; category: string | null;
    variationId: number | null;
    allVariations: Array<{
      variationId: number | null;
      drupalUuid: string | null;
      colorName: string | null;
      colorHex: string | null;
      tipo: string | null;
      images: string[];
      price: string;
    }>;
  };
  relatedProducts: Array<{
    id: string; title: string; price: string; priceNumber: number;
    thumbnail: string | null; badge: null; tag: string | null; tipo: string | null;
    colorName: string | null; colorHex: string | null; category: string | null;
    ocasiones: string[];
    variationId: number | null;
    variations: Array<{
      variationId: number | null;
      drupalUuid: string | null;
      colorName: string | null;
      colorHex: string | null;
      tipo: string | null;
      thumbnail: string | null;
    }>;
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
    tag:         (() => {
        const raw = product.field_tag;
        if (Array.isArray(raw)) return raw.map((o: any) => o.name ?? '').filter(Boolean)[0] ?? null;
        if (raw && typeof raw === 'object' && (raw as any).name) return (raw as any).name;
        return null;
      })(),
      tipo:        (variation?.field_type ?? null)?.toLowerCase() ?? null,
    colorName:   variation?.field_color?.name                  ?? null,
    colorHex:    variation?.field_color?.field_color_hex       ?? null,
    category:    product.field_category?.name                  ?? null,
    variationId: variation?.drupal_internal__variation_id      ?? null,
      allVariations: (Array.isArray(product.variations) ? product.variations : []).map(v => ({
        variationId: v?.drupal_internal__variation_id ?? null,
        drupalUuid: v?.id ?? null,
        colorName: v?.field_color?.name ?? null,
        colorHex: v?.field_color?.field_color_hex ?? null,
        tipo: (v?.field_type ?? null)?.toLowerCase() ?? null,
        images: v ? getVariationGallery(v, NODEHIVE_BASE_URL) : [],
        price: v?.price?.formatted ?? '',
      })),
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
      tag:         (() => {
          const raw = p.field_tag;
          if (Array.isArray(raw)) return raw.map((o: any) => o.name ?? '').filter(Boolean)[0] ?? null;
          if (raw && typeof raw === 'object' && (raw as any).name) return (raw as any).name;
          return null;
        })(),
      tipo:        (v?.field_type ?? null)?.toLowerCase() ?? null,
      colorName:   v?.field_color?.name                  ?? null,
      colorHex:    v?.field_color?.field_color_hex       ?? null,
      category:    p.field_category?.name                ?? null,
      ocasiones:   (() => {
          const raw = p.field_ocasion;
          if (Array.isArray(raw)) return raw.map((o: any) => o.name ?? '').filter(Boolean);
          if (raw && typeof raw === 'object' && raw.name) return [raw.name];
          return [];
        })(),
      variationId: v?.drupal_internal__variation_id      ?? null,
      variations: (Array.isArray(p.variations) ? p.variations : []).map(variation => ({
        variationId: variation?.drupal_internal__variation_id ?? null,
        drupalUuid: variation?.id ?? null,
        colorName: variation?.field_color?.name ?? null,
        colorHex: variation?.field_color?.field_color_hex ?? null,
        tipo: (variation?.field_type ?? null)?.toLowerCase() ?? null,
        thumbnail: (() => {
          const gallery = variation ? getVariationGallery(variation, NODEHIVE_BASE_URL) : [];
          return gallery[0] ?? null;
        })(),
      })),
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

function dedupe(products: FlowerProduct[], excludeId: string): FlowerProduct[] {
  const seen = new Set<string>([excludeId]);
  return products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}