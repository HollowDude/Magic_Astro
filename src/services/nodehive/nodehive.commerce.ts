// src/services/nodehive/nodehive.commerce.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import type {
  CommerceProduct,
  CommerceVariationBase,
  FlowerVariation,
  FlowerProduct,
} from '../../types/nodehive.commerce';
import type { Lang } from '../../i18n/ui';

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
  flower: {
    productType: 'flower',
    variationType: 'flower',
    includes: [
      'variations',
      'variations.field_gallery_of_photos',
      'variations.field_gallery_of_photos.field_media_image',
      'variations.field_color',
      'field_category',
      'field_ocasion',
      'field_tag',
    ],
    productFields: [
      'title',
      'body',
      'field_description',
      'field_category',
      'field_ocasion',
      'field_tag',
      'variations',
    ],
    variationFields: [
      'sku',
      'price',
      'title',
      'field_color',
      'field_gallery_of_photos',
      'field_type',
    ],
    relatedFields: {
      'file--file':                   ['filename', 'uri', 'filemime'],
      'media--image':                 ['name', 'field_media_image'],
      'taxonomy_term--colors':        ['name', 'field_color_hex'],
      'taxonomy_term--flower_category': ['name', 'drupal_internal__tid', 'weight'],
      'taxonomy_term--occasions':     ['name'],
      'taxonomy_term--products_tag':  ['name'],
    },
  },
} satisfies Record<string, ProductTypeConfig>;

export type ProductTypeKey = keyof typeof PRODUCT_CONFIGS;

/**
 * Obtiene productos de NodeHive Commerce usando JSON:API.
 *
 * @param productTypeKey  Clave de PRODUCT_CONFIGS
 * @param lang            Idioma deseado ('es' | 'en'). Si no se pasa, usa el default.
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

  let raw: Awaited<ReturnType<typeof nodehiveFetch<Record<string, unknown>>>>;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
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

/** Obtiene productos del tipo flower con variaciones flower */
export function getFlowerProducts(lang?: Lang): Promise<FlowerProduct[]> {
  return getProducts<FlowerVariation>('flower', lang);
}