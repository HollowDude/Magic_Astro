// src/services/nodehive/nodehive.taxonomy.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import type { FlowerCategoryTerm, NodeHiveFile } from '@/types/nodehive.commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

interface VocabularyConfig {
  vocabulary: string;
  includes: string[];
  termFields: string[];
  relatedFields?: Record<string, string[]>;
}

const VOCABULARY_CONFIGS = {
  flower_category: {
    vocabulary:  'flower_category',
    includes:    [],
    termFields:  ['name', 'weight', 'status', 'drupal_internal__tid'],
    relatedFields: {},
  },
  colors: {
    vocabulary:  'colors',
    includes:    [],
    termFields:  ['name', 'field_color_hex'],
    relatedFields: {},
  },
  occasions: {
    vocabulary:  'occasions',
    includes:    [],
    termFields:  ['name'],
    relatedFields: {},
  },
  products_tag: {
    vocabulary:  'products_tag',
    includes:    [],
    termFields:  ['name'],
    relatedFields: {},
  },
} satisfies Record<string, VocabularyConfig>;

export type VocabularyKey = keyof typeof VOCABULARY_CONFIGS;

/**
 * Tipo genérico base para términos de taxonomía
 */
export interface TaxonomyTermBase {
  type: string;
  id: string;
  name: string;
  status?: boolean;
}

/**
 * Obtiene términos de un vocabulario de NodeHive via JSON:API.
 *
 * @param vocabularyKey  Clave de VOCABULARY_CONFIGS
 * @param limit          Máximo de términos a traer (default: 10)
 * @param lang           Idioma deseado ('es' | 'en'). Si no se pasa, usa el default.
 */
export async function getTaxonomyTerms<
  T extends TaxonomyTermBase = TaxonomyTermBase,
>(vocabularyKey: VocabularyKey, limit = 10, lang?: Lang): Promise<T[]> {
  const config = VOCABULARY_CONFIGS[vocabularyKey];

  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addPageLimit(limit)
    .addInclude(config.includes)
    .addFields(
      `taxonomy_term--${config.vocabulary}`,
      config.termFields,
    );

  // Agregar weight sort solo si existe en termFields
  if (config.termFields.includes('weight')) {
    apiParams.addSort('weight');
  }

  if (config.relatedFields && Object.keys(config.relatedFields).length > 0) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/taxonomy_term/${config.vocabulary}?${apiParams.getQueryString()}`;

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
    console.error(`[Taxonomy] Error de red al obtener "${vocabularyKey}" (lang: ${lang ?? 'default'}):`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Taxonomy] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`);
    return [];
  }

  try {
    return dataFormatter.deserialize(raw.data) as T[];
  } catch (err) {
    console.error(`[Taxonomy] Error al deserializar "${vocabularyKey}":`, err);
    return [];
  }
}

/** Obtiene las primeras N categorías de flores (ordenadas por weight) */
export function getFlowerCategories(limit = 4, lang?: Lang): Promise<FlowerCategoryTerm[]> {
  return getTaxonomyTerms<FlowerCategoryTerm>('flower_category', limit, lang);
}