// src/services/nodehive/nodehive.paragraphs.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { NodeHiveFile } from '../../types/nodehive/base';
import type { Lang } from '../../i18n/ui';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
} as const;

function buildParams(): DrupalJsonApiParams {
  const params = new DrupalJsonApiParams();
  params
    .addInclude([
      'field_component',
      'field_component.field_photosgallery.field_media_image',
      'field_component.field_buttons',
    ])
    // Agregar 'id' para obtener el UUID del nodo
    .addFields('node--content_page', ['id', 'title', 'field_component'])
    .addFields('block_content--hero_carousel', [
      'id', // UUID del bloque
      'field_title',
      'field_subtitle',
      'field_description',
      'field_photosgallery',
      'field_buttons',
    ])
    .addFields('paragraph--button', [
      'field_button_text',
      'field_button_link',
      'field_button_style',
    ])
    .addFields('media--image', ['name', 'field_media_image'])
    .addFields('file--file', ['filename', 'uri'])
    .addPageLimit(1);
  return params;
}

function parseHeroData(rawData: unknown): HeroData | null {
  const result = dataFormatter.deserialize(rawData);
  const pages = Array.isArray(result) ? result : [result];
  const page = pages[0] as { 
    id?: string;  // UUID del nodo
    field_component?: HeroCarouselBlock[] 
  } | null;

  if (!page?.field_component?.length) {
    return null;
  }

  const heroBlock = page.field_component.find(
    (p): p is HeroCarouselBlock => p.type === 'block_content--hero_carousel'
  );

  if (!heroBlock) {
    return null;
  }

  const slides = heroBlock.field_photosgallery?.map((media) => ({
    image: nodehiveMediaUrl(media, NODEHIVE_BASE_URL) ?? '',
    label: media.name ?? 'Imagen',
  })) ?? [];

  const ctaButtons = heroBlock.field_buttons?.map((btn) => ({
    text: btn.field_button_text ?? '',
    url: btn.field_button_link?.uri ?? '#',
    style: btn.field_button_style ?? 'primary',
  })) ?? [];

  return {
    title: heroBlock.field_title ?? null,
    subtitle: heroBlock.field_subtitle ?? null,
    description: heroBlock.field_description ?? null,
    slides,
    ctaButtons,
    pageId: page.id,              // UUID del nodo HomePage
    componentId: heroBlock.id, // UUID del bloque Hero Carousel
  };
}

export async function getHomepageHeroData(lang?: Lang): Promise<HeroData | null> {
  const nodeHiveDefaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? nodeHiveDefaultLang;
  const params = buildParams();
  const path = `/jsonapi/node/content_page?${params.getQueryString()}`;

  // 1. Intentar primero con el idioma solicitado (o el configurado como default)
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (raw.status === 200) {
      const data = parseHeroData(raw.data);
      if (data) return data;
    }
  } catch (err) {
    console.error(`[Paragraphs] Error con lang ${effectiveLang}:`, err);
  }

  // 2. Fallback: Intentar sin prefijo si falla lo anterior
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
    });

    if (raw.status === 200) {
      const data = parseHeroData(raw.data);
      if (data) return data;
    }
  } catch (err) {
    console.error('[Paragraphs] Error sin lang prefix:', err);
  }

  return null;
}
