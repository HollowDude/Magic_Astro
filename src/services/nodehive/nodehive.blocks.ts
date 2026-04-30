// src/services/nodehive/nodehive.blocks.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveFileUrl } from '../../types/nodehive.commerce';
import type { NodeHiveFile } from '../../types/nodehive.commerce';
import type { Lang } from '../../i18n/ui';
import type {
  HeroData,
  HeroSlide,
  PersonalizationData,
  ServiciosData,
  ComentariosData,
} from '../../types/blocks';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

// ── Tipos internos de bloques de NodeHive ──────────────────────────────────────

interface BlockContentBase {
  type: string;
  id: string;
  info: string;
  status: boolean;
}

interface HomepageHeroBlock extends BlockContentBase {
  type: 'block_content--homepage_hero_section';
  field_bienvenida: string;
  field_eslogan: string | null;
  field_descripcion: string;
  field_carrusel_de_fotos: NodeHiveFile[];
}

interface HomepagePersonalizationBlock extends BlockContentBase {
  type: 'block_content--homepage_personalization_section';
  field_titulo: string | null;
  field_descripcion_ps: string;
  field_foto: NodeHiveFile | null;
}

interface ServicioNode {
  type: 'node--services';
  id: string;
  title: string;
  body?: {
    value: string;
    format: string;
    processed: string;
  };
  field_head_photo?: {
    type: 'media--image';
    id: string;
    name: string;
    field_media_image?: NodeHiveFile;
  } | null;
}

interface HomepageServiciosBlock extends BlockContentBase {
  type: 'block_content--homepage_servicios_section';
  field_titulo_ss: string | null;
  field_sub_titulo_ss: string;
  field_eslogan_ss: string | null;
  field_servicios: ServicioNode[];
}

interface ComentarioNode {
  type: 'node--comment';
  id: string;
  body?: {
    value: string;
    format: string;
    processed: string;
  };
  field_person_name: string;
  field_person_rol?: string | null;
}

interface HomepageComentariosBlock extends BlockContentBase {
  type: 'block_content--homepage_comentarios_section';
  field_titulo_cs: string;
  field_descripcion_cs: string;
  field_comentarios: ComentarioNode[];
}

// ── Fetch genérico de bloques ──────────────────────────────────────────────────

async function getBlockByType<T extends BlockContentBase>(
  blockType: string,
  includes: string[],
  lang?: Lang,
): Promise<T | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addFilter('type', `block_content--${blockType}`)
    .addInclude(includes)
    .addPageLimit(1);

  const path = `/jsonapi/block_content/${blockType}?${apiParams.getQueryString()}`;

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });

    if (raw.status !== 200) {
      console.error(`[Blocks] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`);
      return null;
    }

    const result = dataFormatter.deserialize(raw.data);
    const blocks = Array.isArray(result) ? result : [result];
    return blocks.length > 0 ? (blocks[0] as T) : null;
  } catch (err) {
    console.error(`[Blocks] Error al obtener bloque "${blockType}" (lang: ${lang ?? 'default'}):`, err);
    return null;
  }
}

// ── Homepage Hero Section ───────────────────────────────────────────────────────

export async function getHomepageHeroData(lang?: Lang): Promise<HeroData | null> {
  const block = await getBlockByType<HomepageHeroBlock>(
    'homepage_hero_section',
    ['field_carrusel_de_fotos'],
    lang,
  );

  if (!block) return null;

  const slides: HeroSlide[] = (block.field_carrusel_de_fotos ?? []).map((file) => ({
    image: nodehiveFileUrl(file, NODEHIVE_BASE_URL),
    label: file.filename || 'Imagen',
  }));

  return {
    title: block.field_bienvenida,
    slogan: block.field_eslogan,
    description: block.field_descripcion,
    slides,
  };
}

// ── Homepage Personalization Section ────────────────────────────────────────────

export async function getPersonalizationData(lang?: Lang): Promise<PersonalizationData | null> {
  const block = await getBlockByType<HomepagePersonalizationBlock>(
    'homepage_personalization_section',
    ['field_foto'],
    lang,
  );

  if (!block) return null;

  return {
    titulo: block.field_titulo,
    descripcion: block.field_descripcion_ps,
    fotoUrl: block.field_foto ? nodehiveFileUrl(block.field_foto, NODEHIVE_BASE_URL) : null,
  };
}

// ── Homepage Servicios Section ──────────────────────────────────────────────────

export async function getServiciosData(lang?: Lang): Promise<ServiciosData | null> {
  const block = await getBlockByType<HomepageServiciosBlock>(
    'homepage_servicios_section',
    [
      'field_servicios',
      'field_servicios.field_head_photo',
      'field_servicios.field_head_photo.field_media_image',
    ],
    lang,
  );

  if (!block) return null;

  const services = (block.field_servicios ?? []).map((srv) => {
    const bodyText = srv.body?.processed ?? srv.body?.value ?? '';
    const imagen = srv.field_head_photo?.field_media_image
      ? nodehiveFileUrl(srv.field_head_photo.field_media_image, NODEHIVE_BASE_URL)
      : null;

    return {
      title: srv.title,
      description: bodyText,
      image: imagen,
    };
  });

  return {
    titulo: block.field_titulo_ss,
    subTitulo: block.field_sub_titulo_ss,
    eslogan: block.field_eslogan_ss,
    services,
  };
}

// ── Homepage Comentarios Section ────────────────────────────────────────────────

export async function getComentariosData(lang?: Lang): Promise<ComentariosData | null> {
  const block = await getBlockByType<HomepageComentariosBlock>(
    'homepage_comentarios_section',
    ['field_comentarios'],
    lang,
  );

  if (!block) return null;

  const comentarios = (block.field_comentarios ?? []).map((com) => ({
    nombre: com.field_person_name,
    rol: com.field_person_rol ?? null,
    comentario: com.body?.processed ?? com.body?.value ?? '',
  }));

  return {
    titulo: block.field_titulo_cs,
    descripcion: block.field_descripcion_cs,
    comentarios,
  };
}