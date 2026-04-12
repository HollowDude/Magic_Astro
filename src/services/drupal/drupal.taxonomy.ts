// src/services/drupal/drupal.taxonomy.ts
//
// Servicio genérico para obtener términos de cualquier vocabulario de Drupal
// via JSON:API. Sigue el mismo patrón que drupal.commerce.ts.
//
// ── Requisitos en Drupal ───────────────────────────────────────────────────
//   • JSON:API activo: /admin/config/services/jsonapi
//   • Permiso "Access GET on Taxonomy Term resource" para Anonymous
//     en /admin/people/permissions
// ──────────────────────────────────────────────────────────────────────────

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type { TaxonomyTermBase } from '@/types/taxonomy';
import type { CategoriaDeFlores } from '@/types/taxonomy';

const dataFormatter = new Jsona();

// ── Configuración de vocabularios ─────────────────────────────────────────────
//
// Para agregar un vocabulario nuevo:
//   1. Agregar su entrada en VOCABULARY_CONFIGS
//   2. Crear su interface en taxonomy.ts
//   3. Exportar su helper tipado al final de este archivo

interface VocabularyConfig {
  /** Machine name del vocabulario en Drupal (ej: 'categorias_de_flores') */
  vocabulary: string;
  /** Relaciones a incluir (ej: campo imagen) */
  includes: string[];
  /** Campos del término a traer (sparse fieldsets) */
  termFields: string[];
  /** Campos de entidades relacionadas adicionales */
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
  // ── Ejemplo para un futuro vocabulario ────────────────────────────────────
  // ocasiones: {
  //   vocabulary:  'ocasiones',
  //   includes:    ['field_icono'],
  //   termFields:  ['name', 'weight', 'status', 'field_icono'],
  //   relatedFields: { 'file--file': ['filename', 'uri', 'filemime'] },
  // },
} satisfies Record<string, VocabularyConfig>;

export type VocabularyKey = keyof typeof VOCABULARY_CONFIGS;

// ── Fetch genérico ────────────────────────────────────────────────────────────

/**
 * Obtiene términos de un vocabulario de Drupal via JSON:API.
 *
 * @param vocabularyKey  Clave de VOCABULARY_CONFIGS
 * @param limit          Máximo de términos a traer (default: 10)
 * @returns Array de términos con relaciones deserializadas
 */
export async function getTaxonomyTerms<
  T extends TaxonomyTermBase = TaxonomyTermBase,
>(vocabularyKey: VocabularyKey, limit = 10): Promise<T[]> {
  const config = VOCABULARY_CONFIGS[vocabularyKey];

  // ── Construir query JSON:API ──────────────────────────────────────────────
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addSort('weight')             // orden editorial definido en Drupal
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

  // ── Fetch ─────────────────────────────────────────────────────────────────
  let raw: Awaited<ReturnType<typeof drupalFetch<Record<string, unknown>>>>;

  try {
    raw = await drupalFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
    });
  } catch (err) {
    console.error(`[Taxonomy] Error de red al obtener "${vocabularyKey}":`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Taxonomy] HTTP ${raw.status} en ${path}`);
    return [];
  }

  // ── Deserializar ──────────────────────────────────────────────────────────
  try {
    return dataFormatter.deserialize(raw.data) as T[];
  } catch (err) {
    console.error(`[Taxonomy] Error al deserializar "${vocabularyKey}":`, err);
    return [];
  }
}

// ── Helpers tipados por vocabulario ──────────────────────────────────────────

/** Obtiene las primeras N categorías de flores (ordenadas por weight) */
export function getCategoriasDeFlores(limit = 4): Promise<CategoriaDeFlores[]> {
  return getTaxonomyTerms<CategoriaDeFlores>('categorias_de_flores', limit);
}