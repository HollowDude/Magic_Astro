// src/services/drupal/drupal.blocks.ts
//
// Servicio genérico para obtener block_content de Drupal via JSON:API.
// Sigue el mismo patrón que drupal.commerce.ts y drupal.taxonomy.ts.
//
// ── Requisitos en Drupal ───────────────────────────────────────────────────
//   • JSON:API activo con operaciones "All" (o al menos Read)
//   • Permiso GET en block_content para Anonymous (si los bloques son públicos)
//     → /admin/people/permissions
//   • El bloque debe estar publicado (status = true) en
//     → /admin/content/block
// ──────────────────────────────────────────────────────────────────────────

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import { drupalFileUrl } from '@/types/commerce';
import type { BlockContentBase, HomepageHeroBlock, HeroData, HeroSlide } from '@/types/blocks';

const dataFormatter = new Jsona();

// ── Configuración de block types ──────────────────────────────────────────────
//
// Para agregar un nuevo block type:
//   1. Agregar su entrada en BLOCK_CONFIGS
//   2. Crear su interface en blocks.ts
//   3. Exportar su helper tipado al final de este archivo

interface BlockTypeConfig {
  /** Machine name del bundle (ej: 'homepage_hero_section') */
  bundle: string;
  /** Relaciones a incluir */
  includes: string[];
  /** Campos del bloque a traer (sparse fieldsets) */
  blockFields: string[];
  /** Campos de entidades relacionadas adicionales */
  relatedFields?: Record<string, string[]>;
}

const BLOCK_CONFIGS = {
  homepage_hero_section: {
    bundle:      'homepage_hero_section',
    includes:    ['field_carrusel_de_fotos'],
    blockFields: [
      'info',
      'status',
      'field_bienvenida',
      'field_eslogan',
      'field_descripcion',
      'field_carrusel_de_fotos',
      'drupal_internal__id',
    ],
    relatedFields: {
      'file--file': ['filename', 'uri', 'filemime'],
    },
  },
  // ── Ejemplo para una futura sección ───────────────────────────────────────
  // about_intro: {
  //   bundle:      'about_intro',
  //   includes:    ['field_foto_principal'],
  //   blockFields: ['info', 'status', 'field_titulo', 'field_texto', 'field_foto_principal'],
  //   relatedFields: { 'file--file': ['filename', 'uri', 'filemime'] },
  // },
} satisfies Record<string, BlockTypeConfig>;

export type BlockTypeKey = keyof typeof BLOCK_CONFIGS;

// ── Fetch genérico ────────────────────────────────────────────────────────────

/**
 * Obtiene el primer bloque publicado de un bundle dado.
 * Para bloques de configuración (singletons) esto es suficiente.
 * Para múltiples bloques del mismo tipo, usar `getBlockContents`.
 *
 * @param blockTypeKey  Clave de BLOCK_CONFIGS
 * @returns El bloque deserializado o null si no existe / error
 */
export async function getBlockContent<
  T extends BlockContentBase = BlockContentBase,
>(blockTypeKey: BlockTypeKey): Promise<T | null> {
  const blocks = await getBlockContents<T>(blockTypeKey, 1);
  return blocks[0] ?? null;
}

/**
 * Obtiene N bloques publicados de un bundle dado, ordenados por ID.
 *
 * @param blockTypeKey  Clave de BLOCK_CONFIGS
 * @param limit         Máximo de bloques a traer (default: 10)
 */
export async function getBlockContents<
  T extends BlockContentBase = BlockContentBase,
>(blockTypeKey: BlockTypeKey, limit = 10): Promise<T[]> {
  const config = BLOCK_CONFIGS[blockTypeKey];

  // ── Query JSON:API ────────────────────────────────────────────────────────
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addPageLimit(limit)
    .addInclude(config.includes)
    .addFields(
      `block_content--${config.bundle}`,
      config.blockFields,
    );

  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/block_content/${config.bundle}?${apiParams.getQueryString()}`;

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
    console.error(`[Blocks] Error de red al obtener "${blockTypeKey}":`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return [];
  }

  // ── Deserializar ──────────────────────────────────────────────────────────
  try {
    const result = dataFormatter.deserialize(raw.data);
    // Jsona devuelve array o objeto según si hay uno o varios resultados
    return (Array.isArray(result) ? result : [result]) as T[];
  } catch (err) {
    console.error(`[Blocks] Error al deserializar "${blockTypeKey}":`, err);
    return [];
  }
}

// ── Helpers tipados por block type ────────────────────────────────────────────

/**
 * Obtiene el bloque Homepage Hero Section y lo normaliza en HeroData,
 * lista para pasarle directamente al componente HeroCarousel.
 */
export async function getHomepageHeroData(baseUrl: string): Promise<HeroData | null> {
  const block = await getBlockContent<HomepageHeroBlock>('homepage_hero_section');
  if (!block) return null;

  const slides: HeroSlide[] = (block.field_carrusel_de_fotos ?? []).map((file) => ({
    image: drupalFileUrl(file, baseUrl),
    label: file.filename,
  }));

  return {
    title:       block.field_bienvenida,
    slogan:      block.field_eslogan ?? null,
    description: block.field_descripcion,
    slides,
  };
}