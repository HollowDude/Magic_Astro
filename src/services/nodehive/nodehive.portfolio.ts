// src/services/nodehive/nodehive.portfolio.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { Lang } from '@/i18n/ui';
import type {
  PortfolioPageData,
  PortfolioHeaderData,
  PortfolioGalleryData,
  PortfolioEventItem,
  PortfolioEventCategory,
  PortfolioEventImage,
} from '@/types/nodehive/content';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const PORTFOLIO_HEADER_HINTS = [
  'portfolio_header',
  'portfolio_head',
  'portfolio_hero',
  'portfolio_title',
  'portafolio_header',
  'portafolio_head',
  'portafolio_hero',
  'portafolio_title',
];

const PORTFOLIO_GALLERY_HINTS = [
  'portfolio_gallery',
  'portfolio_events',
  'portfolio_grid',
  'portfolio_items',
  'portafolio_gallery',
  'portafolio_events',
  'portafolio_grid',
  'portafolio_items',
];

const GALLERY_EXCLUDE_HINTS = ['gallery', 'events', 'items', 'grid'];

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function matchesHints(type: string, hints: string[]): boolean {
  const token = normalizeToken(type);
  return hints.some((hint) => token.includes(normalizeToken(hint)));
}

function getParagraphBundle(type: string): string {
  return type.startsWith('paragraph--') ? type.slice('paragraph--'.length) : type;
}

function extractText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const maybeObj = value as { value?: unknown; processed?: unknown };
    if (typeof maybeObj.processed === 'string') return maybeObj.processed.trim() || null;
    if (typeof maybeObj.value === 'string') return maybeObj.value.trim() || null;
  }
  return null;
}

function pickStringField(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in attrs) {
      return { value: extractText(attrs[key]), field: key, found: true };
    }
  }
  return { value: null, field: null, found: false };
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value)) return extractNumber(value[0]);
  if (value && typeof value === 'object') {
    const maybeObj = value as { value?: unknown };
    if (maybeObj.value !== undefined) return extractNumber(maybeObj.value);
  }
  return null;
}

function pickNumberField(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in attrs) {
      return { value: extractNumber(attrs[key]), field: key, found: true };
    }
  }
  return { value: null as number | null, field: null, found: false };
}

function findRelationshipField(rawItem: any): string | null {
  const candidates = [
    'field_events',
    'field_items',
    'field_portfolio_items',
    'field_gallery_items',
  ];
  const relationships = rawItem?.relationships ?? {};
  for (const field of candidates) {
    if (relationships[field]?.data && Array.isArray(relationships[field].data)) {
      return field;
    }
  }
  return null;
}

async function fetchWithLangFallback<T>(path: string, lang: string, fallbackLang: string) {
  const primary = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang });
  if (primary.status === 404 && lang !== fallbackLang) {
    const fallback = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang: fallbackLang });
    return fallback.status === 200 ? fallback : primary;
  }
  return primary;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function normalizeEvent(raw: any, baseUrl: string, bundle: string): PortfolioEventItem {
  const title = raw.field_title ?? raw.title ?? '';

  const subtitle = raw.field_subtitle ?? raw.field_sub_title ?? null;

  const catRaw = raw.field_event_category ?? raw.field_category ?? raw.field_type ?? null;
  const category: PortfolioEventCategory | null = catRaw
    ? {
        id: catRaw.id ?? '',
        internalId: catRaw.drupal_internal__tid ?? catRaw.drupal_internal__id ?? null,
        name: catRaw.name ?? catRaw.label ?? '',
        slug: slugify(catRaw.name ?? catRaw.id ?? ''),
      }
    : null;

  const mediaArray = raw.field_gallery ?? raw.field_photos ?? raw.field_images ?? raw.field_photo_gallery ?? [];
  const arr = Array.isArray(mediaArray) ? mediaArray : mediaArray ? [mediaArray] : [];
  const images: PortfolioEventImage[] = arr
    .map((media: any) => {
      const url = nodehiveMediaUrl(media, baseUrl);
      return url ? { url, alt: media.name ?? title } : null;
    })
    .filter(Boolean) as PortfolioEventImage[];

  return {
    id: raw.id ?? '',
    internalId: raw.drupal_internal__id ?? null,
    bundle,
    title,
    subtitle,
    category,
    images,
  };
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function getPortfolioPageData(lang?: Lang): Promise<PortfolioPageData | null> {
  const defaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? defaultLang;

  try {
    // ── Paso A: Encontrar la página portfolio ──────────────────────────────
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'field_component', 'drupal_internal__nid'])
      .addPageLimit(30);

    const nodePath = `/jsonapi/node/content_page?${params.getQueryString()}`;
    const nodeRaw = await fetchWithLangFallback<Record<string, unknown>>(
      nodePath,
      effectiveLang,
      defaultLang,
    );

    if (nodeRaw.status !== 200) {
      console.error(`[Portfolio] HTTP ${nodeRaw.status} fetching content_page`);
      return null;
    }

    const nodeResult = dataFormatter.deserialize(nodeRaw.data) as any[];
    const pages = Array.isArray(nodeResult) ? nodeResult : [];

    const page = pages.find((p: any) => {
      const t = typeof p?.title === 'string' ? p.title.toLowerCase() : '';
      return t.includes('portfolio') || t.includes('portafolio');
    });

    if (!page) {
      console.error('[Portfolio] No content_page found with portfolio/portafolio title');
      return null;
    }

    let pageInternalId = page.drupal_internal__nid ?? null;
    if (pageInternalId == null) {
      const rawData = nodeRaw.data as any;
      const rawPage = rawData?.data?.find((p: any) => p.id === page.id);
      pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;
    }

    const components: any[] = Array.isArray(page.field_component) ? page.field_component : [];
    if (components.length === 0) {
      console.error('[Portfolio] Page has no field_component items');
      return null;
    }

    // ── Paso B: Identificar header y gallery paragraphs ────────────────────
    const headerComponent =
      components.find((c: any) => typeof c?.type === 'string' && matchesHints(c.type, PORTFOLIO_HEADER_HINTS))
      ?? components.find((c: any) => {
        if (typeof c?.type !== 'string') return false;
        const token = normalizeToken(c.type);
        if (!token.includes('portfolio')) return false;
        return !GALLERY_EXCLUDE_HINTS.some((h) => token.includes(normalizeToken(h)));
      })
      ?? null;

    const galleryComponent =
      components.find((c: any) => typeof c?.type === 'string' && matchesHints(c.type, PORTFOLIO_GALLERY_HINTS))
      ?? components.find((c: any) => {
        if (typeof c?.type !== 'string') return false;
        return c !== headerComponent && normalizeToken(c.type).includes('portfolio');
      })
      ?? (components.length === 1 && normalizeToken(components[0].type).includes('portfolio')
        ? components[0]
        : null);

    if (!galleryComponent) {
      console.error('[Portfolio] No gallery component found');
      return null;
    }

    // ── Paso C: Fetch del Header paragraph ─────────────────────────────────
    let header: PortfolioHeaderData | null = null;
    if (headerComponent?.id && headerComponent?.type) {
      try {
        const headerBundle = getParagraphBundle(headerComponent.type);
        const headerPath = `/jsonapi/paragraph/${headerBundle}/${headerComponent.id}`;
        const headerRaw = await fetchWithLangFallback<Record<string, unknown>>(
          headerPath,
          effectiveLang,
          defaultLang,
        );

        if (headerRaw.status === 200) {
          const rawItem = (headerRaw.data as any)?.data ?? null;
          const attrs = rawItem?.attributes ?? {};

          const titleInfo = pickStringField(attrs, ['field_title', 'field_heading', 'title']);
          const subtitleInfo = pickStringField(attrs, ['field_subtitle', 'field_sub_title']);
          const descInfo = pickStringField(attrs, ['field_description', 'field_description_long', 'field_body', 'body']);

          header = {
            paragraphId: rawItem?.id ?? null,
            paragraphInternalId: attrs.drupal_internal__id ?? null,
            parentId: attrs.parent_id ?? null,
            bundle: headerBundle,
            title: titleInfo.value,
            subtitle: subtitleInfo.value,
            description: descInfo.value,
          };
        } else {
          console.error(`[Portfolio] HTTP ${headerRaw.status} fetching header paragraph`);
        }
      } catch (err) {
        console.error('[Portfolio] Error fetching header paragraph:', err);
      }
    }

    // ── Paso D: Fetch del Gallery paragraph ────────────────────────────────
    let gallery: PortfolioGalleryData | null = null;
    try {
      const galleryBundle = getParagraphBundle(galleryComponent.type);
      const galleryPath = `/jsonapi/paragraph/${galleryBundle}/${galleryComponent.id}`;
      const galleryRaw = await fetchWithLangFallback<Record<string, unknown>>(
        galleryPath,
        effectiveLang,
        defaultLang,
      );

      if (galleryRaw.status !== 200) {
        console.error(`[Portfolio] HTTP ${galleryRaw.status} fetching gallery paragraph`);
        return { pageId: page.id, pageInternalId, header, gallery: null };
      }

      const rawGalleryItem = (galleryRaw.data as any)?.data ?? null;
      const galleryAttrs = rawGalleryItem?.attributes ?? {};

      const itemsPerLoadInfo = pickNumberField(galleryAttrs, [
        'field_events_amount',
        'field_items_per_load',
        'field_per_page',
        'field_load_more_count',
        'field_items_per_page',
        'field_quantity',
      ]);
      const itemsPerLoad = itemsPerLoadInfo.value ?? 6;

      const relField = findRelationshipField(rawGalleryItem);
      let eventUuids: string[] = [];
      let eventBundle = galleryBundle;

      if (relField) {
        const relData = rawGalleryItem.relationships[relField].data as any[];
        eventUuids = relData.map((d: any) => d.id);
        if (relData.length > 0 && relData[0].type) {
          eventBundle = getParagraphBundle(relData[0].type);
        }
      }

      if (eventUuids.length === 0) {
        console.warn('[Portfolio] No event UUIDs found in gallery paragraph relationships');
        gallery = {
          paragraphId: rawGalleryItem?.id ?? null,
          paragraphInternalId: galleryAttrs.drupal_internal__id ?? null,
          parentId: galleryAttrs.parent_id ?? null,
          bundle: galleryBundle,
          itemsPerLoad,
          events: [],
          categories: [],
        };
      } else {
        // Fetch events with includes
        const eventParams = new DrupalJsonApiParams();
        eventParams
          .addInclude([
            'field_category',
            'field_photo_gallery',
            'field_photo_gallery.field_media_image',
          ])
          .addFields(`paragraph--${eventBundle}`, [
            'id',
            'drupal_internal__id',
            'field_title',
            'field_subtitle',
            'field_category',
            'field_photo_gallery',
          ])
          .addFields(`paragraph--${galleryBundle}`, [
            'id',
            'drupal_internal__id',
            'field_title',
            'field_subtitle',
            'field_event_category',
            'field_category',
            'field_gallery',
            'field_photos',
            'field_images',
            'field_photo_gallery',
          ])
          .addFields('media--image', ['name', 'field_media_image'])
          .addFields('file--file', ['filename', 'uri'])
          .addPageLimit(50);

        const eventsPath = `/jsonapi/paragraph/${eventBundle}?${eventParams.getQueryString()}`;
        const eventsRaw = await fetchWithLangFallback<Record<string, unknown>>(
          eventsPath,
          effectiveLang,
          defaultLang,
        );

        if (eventsRaw.status !== 200) {
          console.error(`[Portfolio] HTTP ${eventsRaw.status} fetching events`);
          return { pageId: page.id, pageInternalId, header, gallery: null };
        }

        const allEvents = dataFormatter.deserialize(eventsRaw.data) as any[];
        const uuidSet = new Set(eventUuids);
        const matchedEvents = Array.isArray(allEvents)
          ? allEvents.filter((e: any) => uuidSet.has(e.id))
          : [];

        const events: PortfolioEventItem[] = matchedEvents.map((raw: any) => {
          const eventBundle = (raw.type as string ?? '').replace('paragraph--', '');
          return normalizeEvent(raw, NODEHIVE_BASE_URL, eventBundle);
        });

        const categories: PortfolioEventCategory[] = [];
        const seenCatIds = new Set<string>();
        for (const event of events) {
          if (event.category && !seenCatIds.has(event.category.id)) {
            seenCatIds.add(event.category.id);
            categories.push(event.category);
          }
        }

        gallery = {
          paragraphId: rawGalleryItem?.id ?? null,
          paragraphInternalId: galleryAttrs.drupal_internal__id ?? null,
          parentId: galleryAttrs.parent_id ?? null,
          parentInternalId: pageInternalId,
          bundle: galleryBundle,
          itemsPerLoad,
          events,
          categories,
        };
      }
    } catch (err) {
      console.error('[Portfolio] Error fetching gallery paragraph:', err);
      return { pageId: page.id, pageInternalId, header, gallery: null };
    }

    return {
      pageId: page.id ?? undefined,
      pageInternalId,
      header,
      gallery,
    };
  } catch (err) {
    console.error('[Portfolio] Error getPortfolioPageData:', err);
  }
  return null;
}
