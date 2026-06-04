import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import { nodehiveFetch } from './nodehive.client';
import type { Lang } from '@/i18n/ui';

const FETCH_OPTS = {
  headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
} as const;

const ENTITY_TYPE = 'nodehive_fragment';
const BUNDLE = 'whatsapp_button';

export interface WhatsAppButtonData {
  fragmentId: string | null;
  fragmentInternalId: number | null;
  entityType: string;
  bundle: string;
  phoneNumber: string | null;
  messageEs: string | null;
  messageEn: string | null;
  isEnabled: boolean;
}

export async function getWhatsAppButtonData(_lang?: Lang): Promise<WhatsAppButtonData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addFields('nodehive_fragment--whatsapp_button', [
        'id', 'drupal_internal__fid', 'status', 'field_message', 'field_zelle',
      ])
      .addPageLimit(1);

    const queryString = params.getQueryString();
    const path = `/jsonapi/nodehive_fragment/whatsapp_button?${queryString}`;

    const [esRaw, enRaw] = await Promise.all([
      nodehiveFetch<Record<string, unknown>>(path, { ...FETCH_OPTS, lang: 'es', cacheTtl: 60_000 }),
      nodehiveFetch<Record<string, unknown>>(path, { ...FETCH_OPTS, lang: 'en', cacheTtl: 60_000 }),
    ]);

    const esItem = (esRaw.data as any)?.data?.[0] ?? null;
    const enItem = (enRaw.data as any)?.data?.[0] ?? null;

    if (!esItem && !enItem) return null;

    const primaryItem = esItem ?? enItem;
    const esAttrs = esItem?.attributes ?? {};
    const enAttrs = enItem?.attributes ?? {};

    return {
      fragmentId: primaryItem?.id ?? null,
      fragmentInternalId: primaryItem?.attributes?.drupal_internal__fid ?? null,
      entityType: ENTITY_TYPE,
      bundle: BUNDLE,
      phoneNumber: esAttrs.field_zelle ?? enAttrs.field_zelle ?? null,
      messageEs: esAttrs.field_message ?? null,
      messageEn: enAttrs.field_message ?? null,
      isEnabled: primaryItem?.attributes?.status === true,
    };
  } catch (err) {
    console.error('[WhatsApp] Error getWhatsAppButtonData:', err);
    return null;
  }
}
