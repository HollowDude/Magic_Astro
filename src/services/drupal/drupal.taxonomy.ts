// src/services/drupal/drupal.taxonomy.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type { TaxonomyTermBase } from '@/types/taxonomy';
import type { CategoriaDeFlores } from '@/types/taxonomy';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

interface VocabularyConfig {
  vocabulary: string;
  includes: string[];
  termFields: string[];
  relatedFields?: Record<string, string[]>;
}

const VOCABULARY_CONFIGS = {
  categorias_de_flores: {
    vocabulary:  'categorias_de_flores',
    includes:    ['field_foto'],
    termFields:  ['name', 'weight', 'status', 'field_foto', 'drupal_internal__tid'],
    relatedFields: {
      'file--file': ['filename', 'uri', 'filemime'],
    },
  },
} satisfies Record<string, VocabularyConfig>;

export type VocabularyKey = keyof typeof VOCABULARY_CONFIGS;

/**
 * Obtiene términos de un vocabulario de Drupal via JSON:API.
 *
 * @param vocabularyKey  Clave de VOCABULARY_CONFIGS
 * @param limit          Máximo de términos a traer (default: 10)
 * @param lang           Idioma deseado ('es' | 'en'). Si no se pasa, usa el default de Drupal.
 */
export async function getTaxonomyTerms<
  T extends TaxonomyTermBase = TaxonomyTermBase,
>(vocabularyKey: VocabularyKey, limit = 10, lang?: Lang): Promise<T[]> {
  const config = VOCABULARY_CONFIGS[vocabularyKey];

  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addSort('weight')
    .addPageLimit(limit)
    .addInclude(config.includes)
    .addFields(
      `taxonomy_term--${config.vocabulary}`,
      config.termFields,
    );

  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/taxonomy_term/${config.vocabulary}?${apiParams.getQueryString()}`;

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
export function getCategoriasDeFlores(limit = 4, lang?: Lang): Promise<CategoriaDeFlores[]> {
  return getTaxonomyTerms<CategoriaDeFlores>('categorias_de_flores', limit, lang);
}