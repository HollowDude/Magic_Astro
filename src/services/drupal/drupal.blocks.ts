// src/services/drupal/drupal.blocks.ts

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
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

interface BlockTypeConfig {
  bundle: string;
  includes: string[];
  blockFields: string[];
  relatedFields?: Record<string, string[]>;
}

const BLOCK_CONFIGS = {
  homepage_hero_section: {
    bundle:      'homepage_hero_section',
    includes:    ['field_carrusel_de_fotos'],
    blockFields: [
      'info', 'status',
      'field_bienvenida', 'field_eslogan', 'field_descripcion',
      'field_carrusel_de_fotos', 'drupal_internal__id',
    ],
    relatedFields: { 'file--file': ['filename', 'uri', 'filemime'] },
  },

  homepage_personalization_section: {
    bundle:      'homepage_personalization_section',
    includes:    ['field_foto'],
    blockFields: [
      'info', 'status',
      'field_titulo', 'field_descripcion_ps', 'field_foto', 'drupal_internal__id',
    ],
    relatedFields: { 'file--file': ['filename', 'uri', 'filemime'] },
  },

  homepage_servicios_section: {
    bundle:   'homepage_servicios_section',
    // Include the entity-reference field and the image nested inside each node
    includes: ['field_servicios', 'field_servicios.field_image'],
    blockFields: [
      'info', 'status',
      'field_titulo_ss', 'field_sub_titulo_ss', 'field_eslogan_ss',
      'field_servicios', 'drupal_internal__id',
    ],
    relatedFields: {
      // Expose the fields we need from the referenced service nodes
      'node--services': ['title', 'field_description', 'field_image'],
      'file--file':     ['filename', 'uri', 'filemime'],
    },
  },

  homepage_comentarios_section: {
    bundle:      'homepage_comentarios_section',
    includes:    ['field_comentarios'],
    blockFields: [
      'info', 'status',
      'field_titulo_cs', 'field_descripcion_cs', 'field_comentarios', 'drupal_internal__id',
    ],
    relatedFields: {
      'node--comentario': [
        'field_nombre_persona', 'field_role_de_la_persona', 'field_comentario',
      ],
    },
  },
} satisfies Record<string, BlockTypeConfig>;

export type BlockTypeKey = keyof typeof BLOCK_CONFIGS;

// ── Fetch genérico ────────────────────────────────────────────────────────────

export async function getBlockContent<
  T extends BlockContentBase = BlockContentBase,
>(blockTypeKey: BlockTypeKey, lang?: Lang): Promise<T | null> {
  const blocks = await getBlockContents<T>(blockTypeKey, 1, lang);
  return blocks[0] ?? null;
}

export async function getBlockContents<
  T extends BlockContentBase = BlockContentBase,
>(blockTypeKey: BlockTypeKey, limit = 10, lang?: Lang): Promise<T[]> {
  const config = BLOCK_CONFIGS[blockTypeKey];

  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addPageLimit(limit);

  if (config.includes.length > 0) {
    apiParams.addInclude(config.includes);
  }

  apiParams.addFields(`block_content--${config.bundle}`, config.blockFields);

  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      if (fields.length > 0) {
        apiParams.addFields(entityType, fields);
      }
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
      lang,
    });
  } catch (err) {
    console.error(`[Blocks] Error de red al obtener "${blockTypeKey}" (lang: ${lang ?? 'default'}):`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(
      `[Blocks] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`,
      raw.status === 404
        ? '→ Si lang=es y 404: Drupal no tiene prefijo /es/. Usá lang=undefined para español.'
        : ''
    );
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

/** Bloque 1 — Homepage Hero Section */
export async function getHomepageHeroData(baseUrl: string, lang?: Lang): Promise<HeroData | null> {
  const block = await getBlockContent<HomepageHeroBlock>('homepage_hero_section', lang);
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

/** Bloque 2 — Homepage Personalization Section */
export async function getPersonalizationData(baseUrl: string, lang?: Lang): Promise<PersonalizationData | null> {
  const block = await getBlockContent<HomepagePersonalizationBlock>('homepage_personalization_section', lang);
  if (!block) return null;

  return {
    titulo:      block.field_titulo ?? null,
    descripcion: block.field_descripcion_ps,
    fotoUrl:     block.field_foto ? drupalFileUrl(block.field_foto, baseUrl) : null,
  };
}

/**
 * Bloque 3 — Homepage Servicios Section
 *
 * Ahora incluye field_servicios (referencia de entidad → node--services)
 * con sus imágenes anidadas. Los servicios se retornan como array normalizado
 * para que ServicesCarousel pueda renderizarlos directamente.
 */
export async function getServiciosData(baseUrl: string, lang?: Lang): Promise<ServiciosData | null> {
  const block = await getBlockContent<HomepageServiciosBlock>('homepage_servicios_section', lang);
  if (!block) return null;

  const services = (block.field_servicios ?? []).map((s) => ({
    title:       s.title,
    description: s.field_description ?? '',
    image:       s.field_image ? drupalFileUrl(s.field_image, baseUrl) : null,
  }));

  return {
    titulo:    block.field_titulo_ss ?? null,
    subTitulo: block.field_sub_titulo_ss ?? '',
    eslogan:   block.field_eslogan_ss ?? null,
    services,
  };
}

/** Bloque 4 — Homepage Comentarios Section */
export async function getComentariosData(lang?: Lang): Promise<ComentariosData | null> {
  const block = await getBlockContent<HomepageComentariosBlock>('homepage_comentarios_section', lang);
  if (!block) return null;

  return {
    titulo:      block.field_titulo_cs,
    descripcion: block.field_descripcion_cs,
    comentarios: (block.field_comentarios ?? []).map((c) => ({
      nombre:     c.field_nombre_persona,
      rol:        c.field_role_de_la_persona ?? null,
      comentario: c.field_comentario,
    })),
  };
}