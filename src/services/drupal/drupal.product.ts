// src/services/drupal/drupal.product.ts
//
// Servicio para obtener el detalle de un producto y sus productos relacionados.
// Relacionados = misma categoría (primero) + mismo color como fallback.

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type { FloresProduct } from '@/types/commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

// ── Includes y campos reutilizados ────────────────────────────────────────────

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
   .addFields('file--file', ['filename', 'uri', 'filemime'])
   .addFields('taxonomy_term--colores', ['name', 'field_color_hex'])
   .addFields('taxonomy_term--categorias_de_flores', ['name']);
}

// ── getProductById ────────────────────────────────────────────────────────────

/**
 * Obtiene un producto de flores por UUID.
 * Devuelve null si no existe o hay error.
 */
export async function getProductById(id: string, lang?: Lang): Promise<FloresProduct | null> {
  const params = new DrupalJsonApiParams();
  buildBaseParams(params);

  const path = `/jsonapi/commerce_product/flores/${id}?${params.getQueryString()}`;

  try {
    const raw = await drupalFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang,
    });

    if (raw.status !== 200) {
      console.error(`[Product] HTTP ${raw.status} al obtener producto ${id}`);
      return null;
    }

    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result[0] : result) as FloresProduct;
  } catch (err) {
    console.error('[Product] getProductById error:', err);
    return null;
  }
}

// ── getRelatedProducts ────────────────────────────────────────────────────────

/**
 * Obtiene productos relacionados al producto dado.
 *
 * Estrategia:
 *   1. Busca productos de la misma categoría (excluye el producto actual).
 *   2. Si no hay suficientes, complementa con productos del mismo color.
 *   3. Si sigue sin haber, devuelve los más recientes.
 *
 * @param product  Producto de referencia
 * @param lang     Idioma para la respuesta de Drupal
 * @param limit    Máximo de productos relacionados (default: 4)
 */
export async function getRelatedProducts(
  product: FloresProduct,
  lang?: Lang,
  limit = 4,
): Promise<FloresProduct[]> {
  const categoryId = (product as any).field_categoria?.id as string | undefined;
  const colorName  = product.variations?.[0]?.field_color_de_la_flor?.name;

  // ── Intento 1: misma categoría ───────────────────────────────────────────
  if (categoryId) {
    const results = await fetchRelatedByFilter(
      'field_categoria.id',
      categoryId,
      product.id,
      lang,
      limit,
    );
    if (results.length >= limit) return results.slice(0, limit);

    // ── Intento 2: complementar con mismo color ──────────────────────────
    if (colorName && results.length < limit) {
      const byColor = await fetchRelatedByFilter(
        'variations.field_color_de_la_flor.name',
        colorName,
        product.id,
        lang,
        limit - results.length,
      );
      const merged = dedupe([...results, ...byColor], product.id);
      if (merged.length > 0) return merged.slice(0, limit);
    }

    if (results.length > 0) return results;
  }

  // ── Intento 3: fallback — productos recientes ────────────────────────────
  return fetchLatestProducts(product.id, lang, limit);
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
  params
    .addFilter('status', '1')
    .addPageLimit(limit + 1) // +1 para poder excluir el propio producto
    .addFilter(filterPath, filterValue);
  buildBaseParams(params);

  const path = `/jsonapi/commerce_product/flores?${params.getQueryString()}`;

  try {
    const raw = await drupalFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang,
    });
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(Array.isArray(all) ? all as FloresProduct[] : [all as FloresProduct], excludeId);
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
  params
    .addFilter('status', '1')
    .addPageLimit(limit + 1);
  buildBaseParams(params);

  const path = `/jsonapi/commerce_product/flores?${params.getQueryString()}`;

  try {
    const raw = await drupalFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang,
    });
    if (raw.status !== 200) return [];

    const all = dataFormatter.deserialize(raw.data);
    return dedupe(Array.isArray(all) ? all as FloresProduct[] : [all as FloresProduct], excludeId);
  } catch {
    return [];
  }
}

/** Elimina duplicados y excluye el producto actual. */
function dedupe(products: FloresProduct[], excludeId: string): FloresProduct[] {
  const seen = new Set<string>([excludeId]);
  return products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}