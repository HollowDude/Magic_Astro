// src/services/drupal/drupal.commerce.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type {
  CommerceProduct,
  CommerceVariationBase,
  FloresPersonalizadasVariation,
  FloresProduct,
} from '@/types/commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

interface ProductTypeConfig {
  productType: string;
  variationType: string;
  includes: string[];
  productFields: string[];
  variationFields: string[];
  relatedFields?: Record<string, string[]>;
}

const PRODUCT_CONFIGS = {
  flores: {
    productType: 'flores',
    variationType: 'flores_personalizadas',
    includes: [
      'variations',
      'variations.field_galeria_de_fotos',
      'variations.field_color_de_la_flor',
      'field_categoria', 
    ],
    productFields: ['title', 'body', 'variations','field_categoria'],
    variationFields: [
      'sku',
      'price',
      'title',
      'field_color_de_la_flor',
      'field_galeria_de_fotos',
      'field_tipo',
    ],
    relatedFields: {
      'file--file':               ['filename', 'uri', 'filemime'],
      'taxonomy_term--colores':   ['name', 'field_color_hex'],
      'taxonomy_term--categorias_de_flores': ['name'],
    },
  },
} satisfies Record<string, ProductTypeConfig>;

export type ProductTypeKey = keyof typeof PRODUCT_CONFIGS;

/**
 * Obtiene productos de Drupal Commerce usando JSON:API.
 *
 * @param productTypeKey  Clave de PRODUCT_CONFIGS
 * @param lang            Idioma deseado ('es' | 'en'). Si no se pasa, usa el default de Drupal.
 */
export async function getProducts<
  V extends CommerceVariationBase = CommerceVariationBase,
>(productTypeKey: ProductTypeKey, lang?: Lang): Promise<CommerceProduct<V>[]> {
  const config = PRODUCT_CONFIGS[productTypeKey];

  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(config.includes)
    .addFields(
      `commerce_product--${config.productType}`,
      config.productFields,
    )
    .addFields(
      `commerce_product_variation--${config.variationType}`,
      config.variationFields,
    );

  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/commerce_product/${config.productType}?${apiParams.getQueryString()}`;

  let raw: Awaited<ReturnType<typeof drupalFetch<Record<string, unknown>>>>;

  try {
    raw = await drupalFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error(`[Commerce] Error de red (lang: ${lang ?? 'default'}):`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Commerce] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`);
    return [];
  }

  try {
    return dataFormatter.deserialize(raw.data) as CommerceProduct<V>[];
  } catch (err) {
    console.error('[Commerce] Error al deserializar con Jsona:', err);
    return [];
  }
}

/** Obtiene productos del tipo flores con variaciones flores_personalizadas */
export function getFloresProducts(lang?: Lang): Promise<FloresProduct[]> {
  return getProducts<FloresPersonalizadasVariation>('flores', lang);
}