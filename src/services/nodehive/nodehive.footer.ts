// src/services/nodehive/nodehive.footer.ts
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTS = {
  headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
} as const;

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface FooterSocial {
  id: string;
  iconUrl: string | null;       // URL del icono (media)
  iconTitle: string | null;     // Nombre del social (e.g., "Twitter", "Facebook")
  linkUrl: string | null;
  linkTitle: string | null;
}

export interface FooterIdentityData {
  fragmentId: string | null;
  fragmentInternalId: number | null;
  logoUrl: string | null;
  title: string | null;
  phrase: string | null;
  socials: FooterSocial[];
}

export interface FooterAddress {
  line1: string | null;
  line2: string | null;
  line3: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface FooterContactData {
  fragmentId: string | null;
  fragmentInternalId: number | null;
  title: string | null;
  address: FooterAddress | null;
  zelle: string | null;
  mail: string | null;
  schedule: string | null;
}

export interface FooterData {
  identity: FooterIdentityData | null;
  contact: FooterContactData | null;
}

// ── Helper ──────────────────────────────────────────────────────────────────

function extractText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const obj = value as { processed?: unknown; value?: unknown };
    if (typeof obj.processed === 'string') return obj.processed.trim() || null;
    if (typeof obj.value === 'string') return obj.value.trim() || null;
  }
  return null;
}

function parseAddress(raw: unknown): FooterAddress | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  return {
    line1: extractText(a.address_line1 ?? null),
    line2: extractText(a.address_line2 ?? null),
    line3: extractText(a.address_line3 ?? null),
    city: null,
    state: null,
    postalCode: extractText(a.postal_code ?? null),
    country: extractText(a.country_code ?? null),
  };
}

// ── Fetch footer_identity ───────────────────────────────────────────────────

export async function getFooterIdentityData(lang?: Lang): Promise<FooterIdentityData | null> {
  const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude([
        'field_logo',
        'field_logo.field_media_image',
        'field_socials',
        'field_socials.field_icon',
        'field_socials.field_icon.field_media_image',
      ])
      .addFields('nodehive_fragment--footer_identity', [
        'id', 'drupal_internal__fid', 'field_title', 'field_phrase', 'field_logo', 'field_socials',
      ])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addFields('nodehive_fragment--social', ['id', 'drupal_internal__fid', 'title', 'field_icon', 'field_link'])
      .addPageLimit(1);

    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/nodehive_fragment/footer_identity?${params.getQueryString()}`,
      { ...FETCH_OPTS, lang: effectiveLang },
    );

    if (raw.status !== 200) {
      console.error(`[Footer] HTTP ${raw.status} al obtener footer_identity`);
      return null;
    }

    const rawItem = (raw.data as any)?.data?.[0] ?? null;
    const result = dataFormatter.deserialize(raw.data) as any[];
    const item = result?.[0];
    if (!item || !rawItem) return null;

    const attrs = rawItem.attributes ?? {};

    // Logo
    const mediaRef = item.field_logo;
    const logoUrl = mediaRef ? nodehiveMediaUrl(mediaRef, NODEHIVE_BASE_URL) : null;

    // Socials
    const socialsRaw = Array.isArray(item.field_socials)
      ? item.field_socials
      : item.field_socials ? [item.field_socials] : [];

    const socials: FooterSocial[] = socialsRaw.map((s: any) => ({
      id: s.id ?? '',
      iconUrl: s.field_icon ? nodehiveMediaUrl(s.field_icon, NODEHIVE_BASE_URL) : null,
      iconTitle: extractText(s.title ?? null),
      linkUrl: s.field_link?.uri ?? null,
      linkTitle: extractText(s.field_link?.title ?? null),
    }));

    return {
      fragmentId: rawItem.id ?? null,
      fragmentInternalId: attrs.drupal_internal__fid ?? null,
      logoUrl,
      title: extractText(attrs.field_title ?? item.field_title),
      phrase: extractText(attrs.field_phrase ?? item.field_phrase),
      socials,
    };
  } catch (err) {
    console.error('[Footer] Error getFooterIdentityData:', err);
    return null;
  }
}

// ── Fetch footer_contact ────────────────────────────────────────────────────

export async function getFooterContactData(lang?: Lang): Promise<FooterContactData | null> {
  const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  try {
    const params = new DrupalJsonApiParams();
    params
      .addFields('nodehive_fragment--footer_contact', [
        'id', 'drupal_internal__fid',
        'field_title', 'field_direction', 'field_zelle', 'field_mail', 'field_shedule',
      ])
      .addPageLimit(1);

    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/nodehive_fragment/footer_contact?${params.getQueryString()}`,
      { ...FETCH_OPTS, lang: effectiveLang },
    );

    if (raw.status !== 200) {
      console.error(`[Footer] HTTP ${raw.status} al obtener footer_contact`);
      return null;
    }

    const rawItem = (raw.data as any)?.data?.[0] ?? null;
    if (!rawItem) return null;
    const attrs = rawItem.attributes ?? {};

    return {
      fragmentId: rawItem.id ?? null,
      fragmentInternalId: attrs.drupal_internal__fid ?? null,
      title: extractText(attrs.field_title),
      address: parseAddress(attrs.field_direction),
      zelle: extractText(attrs.field_zelle),
      mail: extractText(attrs.field_mail),
      schedule: extractText(attrs.field_shedule), // Note: field is "field_shedule" in Drupal
    };
  } catch (err) {
    console.error('[Footer] Error getFooterContactData:', err);
    return null;
  }
}

// ── Fetch combinado ─────────────────────────────────────────────────────────

export async function getFooterData(lang?: Lang): Promise<FooterData> {
  const [identity, contact] = await Promise.all([
    getFooterIdentityData(lang),
    getFooterContactData(lang),
  ]);
  return { identity, contact };
}
