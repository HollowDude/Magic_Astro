// src/services/nodehive/nodehive.header.ts
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

export interface HeaderLogoData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  bundle: string;
  entityType: string;
  logoUrl: string | null;
  linkUri: string | null;
  linkTitle: string | null;
}

export async function getHeaderLogoData(lang?: Lang): Promise<HeaderLogoData | null> {
  const ENTITY_TYPE = 'nodehive_fragment';
  const BUNDLE = 'header_logo';
  const LOGO_FIELD = 'field_logo';

  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude([LOGO_FIELD, `${LOGO_FIELD}.field_media_image`])
      .addFields(`${ENTITY_TYPE}--${BUNDLE}`, ['id', 'drupal_internal__fid', 'title', LOGO_FIELD, 'field_link'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(1);

    const path = `/jsonapi/${ENTITY_TYPE}/${BUNDLE}?${params.getQueryString()}`;
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang: effectiveLang,
    });

    if (raw.status !== 200) {
      console.error(`[Header] HTTP ${raw.status} al obtener ${BUNDLE}`);
      return null;
    }

    const rawItem = (raw.data as any)?.data?.[0] ?? null;
    const result = dataFormatter.deserialize(raw.data) as any[];
    const item = result?.[0];
    if (!item || !rawItem) return null;

    const mediaRef = item[LOGO_FIELD];
    const logoUrl = mediaRef ? nodehiveMediaUrl(mediaRef, NODEHIVE_BASE_URL) : null;

    const fieldLink = item.field_link ?? rawItem?.attributes?.field_link ?? null;
    const linkUri = fieldLink?.uri ?? null;
    const linkTitle = fieldLink?.title ?? null;

    let parentNodeId: number | null = null;
    if (linkUri && typeof linkUri === 'string') {
      const match = linkUri.match(/entity:node\/(\d+)/);
      if (match) parentNodeId = parseInt(match[1], 10);
    }

    return {
      paragraphId: item.id ?? null,
      paragraphInternalId: rawItem?.attributes?.drupal_internal__fid ?? item.drupal_internal__fid ?? null,
      bundle: BUNDLE,
      entityType: ENTITY_TYPE,
      logoUrl,
      linkUri,
      linkTitle,
      parentNodeId,
    };
  } catch (err) {
    console.error('[Header] Error getHeaderLogoData:', err);
    return null;
  }
}
