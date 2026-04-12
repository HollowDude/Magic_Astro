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
//
// ── Para el bloque Comentarios ────────────────────────────────────────────
//   • El content type "comentario" debe existir en Drupal
//   • Los nodos de tipo "comentario" deben estar publicados
//   • Primero crear nodos Comentario, luego referenciarlos en el bloque
// ──────────────────────────────────────────────────────────────────────────

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import { drupalFileUrl } from '@/types/commerce';
import type {
  BlockContentBase,
  HomepageHeroBlock,
  HomepagePersonalizationBlock,
  HomepageServiciosBlock,
  HomepageComentariosBlock,
  HeroData,
  HeroSlide,
  PersonalizationData,
  ServiciosData,
  ComentariosData,
} from '@/types/blocks';

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
  // ── Bloque 1: Hero Section ─────────────────────────────────────────────────
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

  // ── Bloque 2: Personalization Section ──────────────────────────────────────
  homepage_personalization_section: {
    bundle:      'homepage_personalization_section',
    includes:    ['field_foto'],
    blockFields: [
      'info',
      'status',
      'field_titulo',
      'field_descripcion_ps',
      'field_foto',
      'drupal_internal__id',
    ],
    relatedFields: {
      'file--file': ['filename', 'uri', 'filemime'],
    },
  },

  // ── Bloque 3: Servicios Section ────────────────────────────────────────────
  // Solo texto: eyebrow, título principal y eslogan del header de la sección.
  homepage_servicios_section: {
    bundle:      'homepage_servicios_section',
    includes:    [],
    blockFields: [
      'info',
      'status',
      'field_titulo_ss',
      'field_sub_titulo_ss',
      'field_eslogan_ss',
      'drupal_internal__id',
    ],
    // Sin entidades relacionadas, pero declarado explícitamente para que
    // TypeScript pueda inferir correctamente el tipo de la unión de configs.
    relatedFields: {} as Record<string, string[]>,
  },

  // ── Bloque 4: Comentarios Section ──────────────────────────────────────────
  // Incluye la referencia a entidades node--comentario.
  // Jsona aplana automáticamente las relaciones incluidas.
  homepage_comentarios_section: {
    bundle:      'homepage_comentarios_section',
    includes:    ['field_comentarios'],
    blockFields: [
      'info',
      'status',
      'field_titulo_cs',
      'field_descripcion_cs',
      'field_comentarios',
      'drupal_internal__id',
    ],
    relatedFields: {
      // Sparse fieldsets para los nodos Comentario referenciados
      'node--comentario': [
        'field_nombre_persona',
        'field_role_de_la_persona',
        'field_comentario',
      ],
    },
  },
} satisfies Record<string, BlockTypeConfig>;

export type BlockTypeKey = keyof typeof BLOCK_CONFIGS;

// ── Fetch genérico ────────────────────────────────────────────────────────────

/**
 * Obtiene el primer bloque publicado de un bundle dado.
 * Para bloques de configuración (singletons) esto es suficiente.
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

  try {
    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result : [result]) as T[];
  } catch (err) {
    console.error(`[Blocks] Error al deserializar "${blockTypeKey}":`, err);
    return [];
  }
}

// ── Helpers tipados por block type ────────────────────────────────────────────

/**
 * Bloque 1 — Homepage Hero Section
 * Normaliza el bloque a HeroData para el componente HeroCarousel.
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

/**
 * Bloque 2 — Homepage Personalization Section
 * Normaliza el bloque a PersonalizationData para el componente CustomizationsSection.
 */
export async function getPersonalizationData(baseUrl: string): Promise<PersonalizationData | null> {
  const block = await getBlockContent<HomepagePersonalizationBlock>('homepage_personalization_section');
  if (!block) return null;

  return {
    titulo:    block.field_titulo ?? null,
    descripcion: block.field_descripcion_ps,
    fotoUrl:   block.field_foto ? drupalFileUrl(block.field_foto, baseUrl) : null,
  };
}

/**
 * Bloque 3 — Homepage Servicios Section
 * Normaliza el bloque a ServiciosData para el componente ServicesCarousel.
 */
export async function getServiciosData(): Promise<ServiciosData | null> {
  const block = await getBlockContent<HomepageServiciosBlock>('homepage_servicios_section');
  if (!block) return null;

  return {
    titulo:    block.field_titulo_ss ?? null,
    subTitulo: block.field_sub_titulo_ss,
    eslogan:   block.field_eslogan_ss ?? null,
  };
}

/**
 * Bloque 4 — Homepage Comentarios Section
 * Normaliza el bloque y los nodos Comentario referenciados a ComentariosData.
 *
 * IMPORTANTE: Los nodos de tipo "comentario" deben estar publicados en Drupal
 * antes de ser referenciables desde este bloque. JSON:API no incluirá
 * automáticamente entidades no publicadas.
 */
export async function getComentariosData(): Promise<ComentariosData | null> {
  const block = await getBlockContent<HomepageComentariosBlock>('homepage_comentarios_section');
  if (!block) return null;

  return {
    titulo:      block.field_titulo_cs,
    descripcion: block.field_descripcion_cs,
    comentarios: (block.field_comentarios ?? []).map((c) => ({
      nombre:   c.field_nombre_persona,
      rol:      c.field_role_de_la_persona ?? null,
      comentario: c.field_comentario,
    })),
  };
}