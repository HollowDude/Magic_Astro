// src/services/nodehive/nodehive.paragraphs.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '../../types/nodehive.commerce';
import type { HeroCarouselParagraph, HeroData } from '../../types/nodehive.paragraphs';
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
      'field_components',
      'field_components.field_hero_images.field_media_image',
      'field_components.field_cta_buttons',
    ])
    .addFields('node--content_page', ['title', 'field_components'])
    .addFields('paragraph--hero_carousel', [
      'field_title',
      'field_subtitle',
      'field_description',
      'field_hero_images',
      'field_cta_buttons',
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
  const page = pages[0] as { field_components?: HeroCarouselParagraph[] } | null;

  if (!page?.field_components?.length) {
    return null;
  }

  const heroParagraph = page.field_components.find(
    (p): p is HeroCarouselParagraph => p.type === 'paragraph--hero_carousel'
  );

  if (!heroParagraph) {
    return null;
  }

  const slides = heroParagraph.field_hero_images?.map((media) => ({
    image: nodehiveMediaUrl(media, NODEHIVE_BASE_URL) ?? '',
    label: media.name ?? 'Imagen',
  })) ?? [];

  const ctaButtons = heroParagraph.field_cta_buttons?.map((btn) => ({
    text: btn.field_button_text ?? '',
    url: btn.field_button_link?.uri ?? '#',
    style: btn.field_button_style ?? 'primary',
  })) ?? [];

  return {
    title: heroParagraph.field_title ?? null,
    subtitle: heroParagraph.field_subtitle ?? null,
    description: heroParagraph.field_description ?? null,
    slides,
    ctaButtons,
  };
}

export async function getHomepageHeroData(lang?: Lang): Promise<HeroData | null> {
  const nodeHiveDefaultLang = 'en';
  const effectiveLang = lang ?? nodeHiveDefaultLang;
  const params = buildParams();
  const path = `/jsonapi/node/content_page?${params.getQueryString()}`;

  // Try without language prefix first
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
    });

    if (raw.status === 200) {
      const data = parseHeroData(raw.data);
      if (data) return data;
    }
  } catch (err) {
    console.error('[Paragraphs] Error without lang prefix:', err);
  }

  // Try with language prefix
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
    console.error(`[Paragraphs] Error with lang ${effectiveLang}:`, err);
  }

  return null;
}