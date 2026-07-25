// src/services/nodehive/nodehive.paragraphs.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { NodeHiveFile } from '../../types/nodehive/base';
import type { Lang } from '../../i18n/ui';
import type { CategoryBlockData, FeaturedProductsData, ServicesBlockData, CommentsBlockData, ContactBlockData } from './nodehive.blocks';
import type {
  AboutHeroData,
  AboutStoryData,
  AboutArchievementsData,
  AboutCertificactionData,
  AboutIdentityData,
  AboutObjectifsData,
  AboutObjectiveItem,
  ShopPageData,
  ShopHeaderData,
  ShopBodyData,
  AuthPageData,
  AuthHeroPanelData,
  AuthFormHeaderData,
} from '../../types/nodehive/content';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
} as const;

function extractText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return extractText(value[0]);
  if (value && typeof value === 'object') {
    const maybeObj = value as { value?: unknown; processed?: unknown };
    if (typeof maybeObj.processed === 'string') return maybeObj.processed.trim() || null;
    if (typeof maybeObj.value === 'string') return maybeObj.value.trim() || null;
  }
  return null;
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

function pickText(attrs: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (key in attrs) {
      const value = extractText(attrs[key]);
      if (value) return value;
    }
  }
  return null;
}

function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchMediaImageUrl(mediaId: string, lang: string): Promise<string | null> {
  const mediaRaw = await nodehiveFetch<Record<string, unknown>>(
    `/jsonapi/media/image/${mediaId}?include=field_media_image&fields[media--image]=field_media_image&fields[file--file]=uri`,
    { ...FETCH_OPTIONS, lang }
  );
  if (mediaRaw.status !== 200) return null;
  const mediaResult = dataFormatter.deserialize(mediaRaw.data) as any;
  const file = mediaResult?.field_media_image;
  return file?.uri?.url ? `${NODEHIVE_BASE_URL}${file.uri.url}` : null;
}

async function fetchFileUrl(fileId: string, lang: string): Promise<string | null> {
  const fileRaw = await nodehiveFetch<Record<string, unknown>>(
    `/jsonapi/file/file/${fileId}?fields[file--file]=uri`,
    { ...FETCH_OPTIONS, lang }
  );
  if (fileRaw.status !== 200) return null;
  const fileResult = dataFormatter.deserialize(fileRaw.data) as any;
  const uri = fileResult?.uri?.url ?? fileResult?.uri?.value ?? null;
  return uri ? `${NODEHIVE_BASE_URL}${uri}` : null;
}

function getParagraphBundleName(type: string): string {
  return type.startsWith('paragraph--') ? type.slice('paragraph--'.length) : type;
}

async function fetchParagraphItem(type: string, id: string, lang: string) {
  const bundle = getParagraphBundleName(type);
  const raw = await nodehiveFetch<Record<string, unknown>>(
    `/jsonapi/paragraph/${bundle}/${id}`,
    { ...FETCH_OPTIONS, lang }
  );
  if (raw.status !== 200) return null;
  const item = (raw.data as any)?.data ?? null;
  return item ? { id: item.id, attributes: item.attributes ?? {}, relationships: item.relationships ?? {} } : null;
}

async function resolveParagraphRefs(
  refs: Array<{ type: string; id: string }>,
  lang: string,
): Promise<Array<{ id: string; attributes: Record<string, unknown>; relationships: Record<string, unknown> }>> {
  const items = await Promise.all(
    refs.map((ref) => (ref?.type?.startsWith('paragraph--') && ref?.id
      ? fetchParagraphItem(ref.type, ref.id, lang)
      : Promise.resolve(null)))
  );
  return items.filter(Boolean) as Array<{ id: string; attributes: Record<string, unknown>; relationships: Record<string, unknown> }>;
}

async function extractParagraphImageUrl(relationships: Record<string, any>, lang: string): Promise<string | null> {
  const keys = Object.keys(relationships ?? {}).filter((key) => /photo|image/i.test(key));
  for (const key of keys) {
    const relData = relationships?.[key]?.data ?? null;
    const refs = Array.isArray(relData) ? relData : relData ? [relData] : [];
    for (const ref of refs) {
      if (!ref?.type || !ref?.id) continue;
      if (ref.type === 'media--image') {
        const mediaUrl = await fetchMediaImageUrl(ref.id, lang);
        if (mediaUrl) return mediaUrl;
      }
      if (ref.type === 'file--file') {
        const fileUrl = await fetchFileUrl(ref.id, lang);
        if (fileUrl) return fileUrl;
      }
    }
  }
  return null;
}

export async function getHomepageHeroData(lang?: Lang): Promise<HeroData | null> {
  const nodeHiveDefaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? nodeHiveDefaultLang;

  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'field_component', 'drupal_internal__nid'])
      .addPageLimit(20);

    const nodePath = `/jsonapi/node/content_page?${params.getQueryString()}`;

    const nodeRaw = await nodehiveFetch<Record<string, unknown>>(nodePath, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (nodeRaw.status !== 200) {
      console.error(`[Paragraphs] HTTP ${nodeRaw.status} fetching content_page`);
      return null;
    }

    const nodeResult = dataFormatter.deserialize(nodeRaw.data) as any[];
    const pages = Array.isArray(nodeResult) ? nodeResult : [];
    const page = pages.find((p: any) =>
      Array.isArray(p.field_component) &&
      p.field_component.some((c: any) => c.type === 'paragraph--_component_home_hero')
    );
    if (!page?.field_component?.length) return null;

    let pageInternalId = page.drupal_internal__nid ?? null;
    if (pageInternalId == null) {
      const rawData = nodeRaw.data as any;
      const rawPage = rawData?.data?.find((p: any) => p.id === page.id);
      pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;
    }

    const heroParagraph = page.field_component.find(
      (p: any) => p.type === 'paragraph--_component_home_hero'
    );
    if (!heroParagraph) return null;

    const heroUuid = heroParagraph.id;
    const heroParams = new DrupalJsonApiParams();
    heroParams
      .addInclude(['field_photos_slider', 'field_photos_slider.field_media_image', 'field_buttons'])
      .addFields('paragraph--_component_home_hero', [
        'id', 'drupal_internal__id', 'field_title', 'field_subtitle', 'field_description', 'field_photos_slider', 'field_buttons',
      ])
      .addFields('paragraph--button', ['field_button_text', 'field_button_link', 'field_button_style'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri']);

    const heroPath = `/jsonapi/paragraph/_component_home_hero/${heroUuid}?${heroParams.getQueryString()}`;

    const heroRaw = await nodehiveFetch<Record<string, unknown>>(heroPath, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (heroRaw.status !== 200) {
      console.error(`[Paragraphs] HTTP ${heroRaw.status} fetching hero paragraph`);
      return null;
    }

    const heroData = dataFormatter.deserialize(heroRaw.data) as any;
    if (!heroData) return null;

    const rawHero = heroRaw.data as any;
    const heroParentId = rawHero?.data?.attributes?.parent_id ?? null;

    const slides = (heroData.field_photos_slider ?? [])
      .map((media: any) => {
        const image = nodehiveMediaUrl(media, NODEHIVE_BASE_URL);
        if (!image) return null;
        return {
          image,
          label: media.name ?? 'Imagen',
        };
      })
      .filter((slide): slide is { image: string; label: string } => slide !== null);

    const ctaButtons = (heroData.field_buttons ?? []).map((btn: any) => ({
      text: btn.field_button_text ?? '',
      url: (btn.field_button_link?.uri ?? '#').replace(/^internal:/, ''),
      style: btn.field_button_style ?? 'primary',
    }));

    return {
      title: heroData.field_title ?? null,
      subtitle: heroData.field_subtitle ?? null,
      description: heroData.field_description ?? null,
      slides,
      ctaButtons,
      pageId: page.id,
      pageInternalId,
      parentId: heroParentId,
      componentId: heroData.id,
      componentInternalId: heroData.drupal_internal__id,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getHomepageHeroData:', err);
  }
  return null;
}

// ── Categories Paragraph ─────────────────────────────────────────────────────

export async function getCategoryParagraphData(lang?: Lang): Promise<CategoryBlockData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_categories.field_head_photo.field_media_image'])
      .addFields('paragraph--_component_home_categories', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle', 'field_categories',
      ])
      .addFields('node--category', ['id', 'name', 'drupal_internal__tid', 'field_slug', 'field_head_photo'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addFields('taxonomy_term--flower_category', ['name', 'drupal_internal__tid', 'field_slug'])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_home_categories?${params.getQueryString()}`;
    const langParam = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
    const effectiveLang = lang ?? langParam;

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (raw.status === 200) {
      const rawItem = (raw.data as any)?.data?.[0];
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph || !rawItem) return null;

      // DEBUG Task 1: Log raw paragraph data
      console.log('[Categories DEBUG] rawItem.id:', rawItem?.id);
      console.log('[Categories DEBUG] rawItem.attributes.drupal_internal__id:', rawItem?.attributes?.drupal_internal__id);
      console.log('[Categories DEBUG] rawItem.attributes.parent_id:', rawItem?.attributes?.parent_id);
      console.log('[Categories DEBUG] rawItem.type:', rawItem?.type);
      console.log('[Categories DEBUG] paragraph.drupal_internal__id:', paragraph?.drupal_internal__id);

      const relData = rawItem?.relationships?.field_categories?.data ?? [];
      const rels = Array.isArray(relData) ? relData : relData ? [relData] : [];

      // DEBUG Task 5: Log relationship refs
      console.log('[Categories DEBUG] rels:', JSON.stringify(rels));

      const usesParagraphs = rels.some((ref: any) => typeof ref?.type === 'string' && ref.type.startsWith('paragraph--'));
      console.log('[Categories DEBUG] usesParagraphs:', usesParagraphs);

      let categorias: Array<{ id: string; nombre: string; slug: string; imagen: string | null }> = [];

      if (usesParagraphs) {
        const items = await resolveParagraphRefs(rels, effectiveLang);
        categorias = await Promise.all(items.map(async (item, index) => {
          const attrs = item.attributes ?? {};
          const nombre = pickText(attrs, ['field_title', 'field_name', 'title', 'name']) ?? '';
          const slugBase = pickText(attrs, ['field_slug', 'field_slug_value', 'field_machine_name']) ?? '';
          const slug = slugBase || (nombre ? slugifyText(nombre) : '') || item.id || String(index);
          const imagen = await extractParagraphImageUrl(item.relationships ?? {}, effectiveLang);
          return {
            id: item.id ?? String(index),
            nombre,
            slug,
            imagen,
          };
        }));
      } else {
        categorias = (paragraph.field_categories ?? []).map((cat: any) => ({
          id: cat.id ?? '',
          nombre: cat.name ?? '',
          slug: cat.field_slug ?? cat.drupal_internal__tid?.toString() ?? cat.id ?? '',
          imagen: cat.field_head_photo ? nodehiveMediaUrl(cat.field_head_photo, NODEHIVE_BASE_URL) : null,
        }));
      }

      // FIX Task 4: Read from raw instead of deserialized (Jsona may not flatten drupal_internal__id)
      const paragraphInternalId = rawItem?.attributes?.drupal_internal__id ?? paragraph.drupal_internal__id ?? null;
      const parentId = rawItem?.attributes?.parent_id ?? null;

      console.log('[Categories] paragraph.id:', paragraph?.id);
      console.log('[Categories] paragraphInternalId:', paragraphInternalId);
      console.log('[Categories] parentId:', parentId);

      return {
        paragraphId: paragraph.id,
        paragraphInternalId,
        parentId,
        titulo: paragraph.field_title ?? null,
        subTitulo: paragraph.field_subtitle ?? null,
        categorias,
      };
    }
  } catch (err) {
    console.error('[Paragraphs] Error getCategoryParagraphData:', err);
  }
  return null;
}

// ── Featured Products Paragraph ────────────────────────────────────────────

export async function getFeaturedProductsParagraphData(lang?: Lang): Promise<FeaturedProductsData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude([
        'field_products',
        'field_products.variations',
        'field_products.variations.field_gallery_of_photos',
        'field_products.variations.field_gallery_of_photos.field_media_image',
        'field_products.variations.field_color',
      ])
      .addFields('paragraph--_component_home_products', ['id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_products'])
      .addFields('commerce_product--flower', ['id', 'title', 'variations'])
      .addFields('commerce_product_variation--flower', ['id', 'sku', 'price', 'field_color', 'field_type', 'field_gallery_of_photos'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addFields('taxonomy_term--colors', ['name'])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_home_products?${params.getQueryString()}`;
    const langParam = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
    const effectiveLang = lang ?? langParam;

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (raw.status === 200) {
      const rawItem = (raw.data as any)?.data?.[0];
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph) return null;

      const productos = (paragraph.field_products ?? []).map((product: any) => {
        const variations = Array.isArray(product.variations) ? product.variations : product.variations ? [product.variations] : [];
        const variation = variations[0];

        const gallery = variation?.field_gallery_of_photos
          ? (Array.isArray(variation.field_gallery_of_photos) ? variation.field_gallery_of_photos : [variation.field_gallery_of_photos])
          : [];

        let thumbnail: string | null = null;
        for (const mediaWrapper of gallery) {
          if (mediaWrapper) {
            thumbnail = nodehiveMediaUrl(mediaWrapper as any, NODEHIVE_BASE_URL) ?? null;
            if (thumbnail) break;
          }
        }

        let color: string | null = null;
        if (variation?.field_color) {
          color = (variation.field_color as any).name ?? null;
        }

        return {
          id: product.id ?? '',
          title: product.title ?? '',
          price: variation?.price?.formatted ?? '',
          thumbnail,
          color,
          tipo: variation?.field_type ?? null,
          url: `/${product.id}`,
        };
      });

      const paragraphInternalId = rawItem?.attributes?.drupal_internal__id ?? paragraph.drupal_internal__id ?? null;
      const parentId = rawItem?.attributes?.parent_id ?? null;

      return {
        paragraphId: paragraph.id,
        paragraphInternalId,
        parentId,
        titulo: paragraph.field_title ?? null,
        productos,
      };
    }
  } catch (err) {
    console.error('[Paragraphs] Error getFeaturedProductsParagraphData:', err);
  }
  return null;
}

// ── Services Paragraph ───────────────────────────────────────────────────────

export async function getServicesParagraphData(lang?: Lang): Promise<ServicesBlockData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_services.field_head_photo.field_media_image'])
      .addFields('paragraph--_component_home_services', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle', 'field_subtitle_primary', 'field_services',
      ])
      .addFields('node--services', ['id', 'title', 'field_name', 'field_description', 'field_head_photo'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(1);

      const path = `/jsonapi/paragraph/_component_home_services?${params.getQueryString()}`;
      const langParam = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
      const effectiveLang = lang ?? langParam;

      const raw = await nodehiveFetch<Record<string, unknown>>(path, {
        ...FETCH_OPTIONS,
        lang: effectiveLang,
      });

      if (raw.status === 200) {
        const rawItem = (raw.data as any)?.data?.[0];
        const result = dataFormatter.deserialize(raw.data) as any[];
        const paragraph = result?.[0];
        if (!paragraph || !rawItem) return null;

        const relData = rawItem?.relationships?.field_services?.data ?? [];
        const rels = Array.isArray(relData) ? relData : relData ? [relData] : [];

        const usesParagraphs = rels.some((ref: any) => typeof ref?.type === 'string' && ref.type.startsWith('paragraph--'));

        let servicios: Array<{ id: string; titulo: string; descripcion: string; imagen: string | null }> = [];

        if (usesParagraphs) {
          const items = await resolveParagraphRefs(rels, effectiveLang);
          servicios = await Promise.all(items.map(async (item, index) => {
            const attrs = item.attributes ?? {};
            const titulo = pickText(attrs, ['field_title', 'field_name', 'title', 'name']) ?? '';
            const descripcion = pickText(attrs, ['field_description', 'field_description_long', 'field_body', 'body', 'field_text', 'field_summary']) ?? '';
            const imagen = await extractParagraphImageUrl(item.relationships ?? {}, effectiveLang);
            return {
              id: item.id ?? String(index),
              titulo,
              descripcion,
              imagen,
            };
          }));
        } else {
          servicios = (paragraph.field_services ?? []).map((svc: any) => ({
            id: svc.id ?? '',
            titulo: svc.field_name ?? svc.title ?? '',
            descripcion: svc.field_description ?? '',
            imagen: svc.field_head_photo ? nodehiveMediaUrl(svc.field_head_photo, NODEHIVE_BASE_URL) : null,
          }));
        }

        const paragraphInternalId = rawItem?.attributes?.drupal_internal__id ?? paragraph.drupal_internal__id ?? null;
        const parentId = rawItem?.attributes?.parent_id ?? null;

        return {
          paragraphId: paragraph.id,
          paragraphInternalId,
          parentId,
          titulo: paragraph.field_title ?? null,
          subTitulo: paragraph.field_subtitle ?? null,
          subTituloPrimary: paragraph.field_subtitle_primary ?? null,
          servicios,
        };
      }
  } catch (err) {
    console.error('[Paragraphs] Error getServicesParagraphData:', err);
  }
  return null;
}

// ── Comments Paragraph ──────────────────────────────────────────────────────

export async function getCommentsParagraphData(lang?: Lang): Promise<CommentsBlockData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_comments'])
      .addFields('paragraph--_component_home_comments', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle', 'field_comments',
      ])
      .addFields('node--comment', [
        'id', 'title', 'field_person_name', 'field_person_rol', 'field_comment', 'field_calification',
      ])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_home_comments?${params.getQueryString()}`;
    const langParam = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
    const effectiveLang = lang ?? langParam;

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (raw.status === 200) {
      const rawItem = (raw.data as any)?.data?.[0];
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph || !rawItem) return null;

      const relData = rawItem?.relationships?.field_comments?.data ?? [];
      const rels = Array.isArray(relData) ? relData : relData ? [relData] : [];
      const usesParagraphs = rels.some((ref: any) => typeof ref?.type === 'string' && ref.type.startsWith('paragraph--'));

      let comentarios: Array<{ id: string; nombre: string; rol: string; comentario: string; calificacion: number }> = [];

      if (usesParagraphs) {
        const items = await resolveParagraphRefs(rels, effectiveLang);
        comentarios = items.map((item, index) => {
          const attrs = item.attributes ?? {};
          const nombre = pickText(attrs, ['field_person_name', 'field_name', 'field_title', 'title', 'name']) ?? '';
          const rol = pickText(attrs, ['field_person_rol', 'field_role']) ?? '';
          const comentario = pickText(attrs, ['field_comment', 'field_description', 'body', 'field_body']) ?? '';
          const calificacion = extractNumber(attrs.field_calification ?? attrs.field_rating ?? attrs.field_score) ?? 5;
          return {
            id: item.id ?? String(index),
            nombre,
            rol,
            comentario,
            calificacion,
          };
        });
      } else {
        comentarios = (paragraph.field_comments ?? []).map((c: any) => ({
          id: c.id ?? '',
          nombre: c.field_person_name ?? c.title ?? '',
          rol: c.field_person_rol ?? '',
          comentario: c.field_comment ?? '',
          calificacion: c.field_calification ?? 5,
        }));
      }

      const paragraphInternalId = rawItem?.attributes?.drupal_internal__id ?? paragraph.drupal_internal__id ?? null;
      const parentId = rawItem?.attributes?.parent_id ?? null;

      return {
        paragraphId: paragraph.id,
        paragraphInternalId,
        parentId,
        titulo: paragraph.field_title ?? null,
        subTitulo: paragraph.field_subtitle ?? null,
        comentarios,
      };
    }
  } catch (err) {
    console.error('[Paragraphs] Error getCommentsParagraphData:', err);
  }
  return null;
}

// ── Contact Us Paragraph ────────────────────────────────────────────────────

export async function getContactUsParagraphData(lang?: Lang): Promise<ContactBlockData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_button', 'field_head_photo.field_media_image'])
      .addFields('paragraph--_component_home_contact_us', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_description', 'field_button', 'field_head_photo',
      ])
      .addFields('paragraph--button', ['field_button_text', 'field_button_link'])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_home_contact_us?${params.getQueryString()}`;
    const langParam = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
    const effectiveLang = lang ?? langParam;

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      ...FETCH_OPTIONS,
      lang: effectiveLang,
    });

    if (raw.status === 200) {
      const rawItem = (raw.data as any)?.data?.[0];
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph) return null;

      let fotoUrl: string | null = null;
      try {
        const mediaWrapper = paragraph.field_head_photo;
        if (mediaWrapper?.field_media_image) {
          fotoUrl = nodehiveMediaUrl(mediaWrapper, NODEHIVE_BASE_URL);
        }
      } catch (e) {
        console.warn('[Paragraphs] Error processing field_head_photo:', e);
      }
      const ctaText = paragraph.field_button?.field_button_text ?? null;
      const ctaUrl = (paragraph.field_button?.field_button_link?.uri ?? null)?.replace(/^internal:/, '') ?? null;

      const paragraphInternalId = rawItem?.attributes?.drupal_internal__id ?? paragraph.drupal_internal__id ?? null;
      const parentId = rawItem?.attributes?.parent_id ?? null;

      return {
        paragraphId: paragraph.id,
        paragraphInternalId,
        parentId,
        titulo: paragraph.field_title ?? null,
        subTitulo: null,
        descripcion: paragraph.field_description ?? null,
        fotoUrl,
        ctaText,
        ctaUrl,
      };
    }
  } catch (err) {
    console.error('[Paragraphs] Error getContactUsParagraphData:', err);
  }
  return null;
}

// ── Shop Page Paragraphs ─────────────────────────────────────────────────────

const SHOP_HEADER_HINTS = ['shop_header', 'shop-hero', 'shop_head', 'shop_title'];
const SHOP_BODY_HINTS = ['shop_body', 'shop_filters', 'shop_catalog', 'shop_products', 'shop_list'];

const SHOP_HEADER_TITLE_FIELDS = ['field_title', 'title', 'field_heading', 'field_headline'];
const SHOP_HEADER_DESC_FIELDS = ['field_description', 'field_subtitle', 'field_summary', 'field_text', 'field_body', 'body'];

const SHOP_BODY_FILTER_FIELDS = ['field_filters', 'field_filter', 'field_filters_list', 'field_available_filters'];
const SHOP_BODY_SORT_FIELDS = ['field_sorts', 'field_sort', 'field_sorts_list', 'field_available_sorts', 'field_sorting'];
const SHOP_BODY_ITEMS_FIELDS = [
  'field_products_per_page',
  'field_items_per_page',
  'field_page_size',
  'field_products_limit',
  'field_items_limit',
  'field_products_quantity',
];

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

function isShopComponent(type: string): boolean {
  return normalizeToken(type).includes('shop');
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter((item): item is string => Boolean(item));
  }
  const single = extractText(value);
  return single ? [single] : [];
}

function pickStringField(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in attrs) {
      return { value: extractText(attrs[key]), field: key, found: true };
    }
  }
  return { value: null, field: null, found: false };
}

function pickListField(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in attrs) {
      return { list: normalizeStringList(attrs[key]), field: key, found: true };
    }
  }
  return { list: null as string[] | null, field: null, found: false };
}

function pickNumberField(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in attrs) {
      return { value: extractNumber(attrs[key]), field: key, found: true };
    }
  }
  return { value: null as number | null, field: null, found: false };
}

async function fetchWithLangFallback<T>(path: string, lang: string, fallbackLang: string) {
  const primary = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang });
  if (primary.status === 404 && lang !== fallbackLang) {
    const fallback = await nodehiveFetch<T>(path, { ...FETCH_OPTIONS, lang: fallbackLang });
    return fallback.status === 200 ? fallback : primary;
  }
  return primary;
}

export async function getShopPageData(lang?: Lang): Promise<ShopPageData | null> {
  const defaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? defaultLang;

  try {
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
      console.error(`[Shop] HTTP ${nodeRaw.status} fetching content_page`);
      return null;
    }

    const nodeResult = dataFormatter.deserialize(nodeRaw.data) as any[];
    const pages = Array.isArray(nodeResult) ? nodeResult : [];

    const getComponents = (page: any) =>
      Array.isArray(page?.field_component) ? page.field_component : [];

    const shopPages = pages.filter((page) =>
      getComponents(page).some((c: any) => typeof c?.type === 'string' && isShopComponent(c.type)),
    );

    const pageWithBoth = shopPages.find((page) => {
      const components = getComponents(page);
      return (
        components.some((c: any) => typeof c?.type === 'string' && matchesHints(c.type, SHOP_HEADER_HINTS)) &&
        components.some((c: any) => typeof c?.type === 'string' && matchesHints(c.type, SHOP_BODY_HINTS))
      );
    });

    const pageByTitle = pages.find((page) => {
      const title = typeof page?.title === 'string' ? page.title.toLowerCase() : '';
      return title === 'shop' || title === 'tienda';
    });

    const page = pageWithBoth ?? shopPages[0] ?? pageByTitle ?? null;
    if (!page) return null;

    let pageInternalId = page.drupal_internal__nid ?? null;
    if (pageInternalId == null) {
      const rawData = nodeRaw.data as any;
      const rawPage = rawData?.data?.find((p: any) => p.id === page.id);
      pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;
    }

    const components = getComponents(page);
    const shopComponents = components.filter((c: any) => typeof c?.type === 'string' && isShopComponent(c.type));

    const headerComponent =
      components.find((c: any) => typeof c?.type === 'string' && matchesHints(c.type, SHOP_HEADER_HINTS))
      ?? shopComponents[0]
      ?? null;

    const bodyComponent =
      components.find((c: any) => typeof c?.type === 'string' && matchesHints(c.type, SHOP_BODY_HINTS))
      ?? shopComponents[1]
      ?? null;

    let header: ShopHeaderData | null = null;
    if (headerComponent?.id && headerComponent?.type) {
      const bundle = getParagraphBundleName(headerComponent.type);
      const headerPath = `/jsonapi/paragraph/${bundle}/${headerComponent.id}`;
      const headerRaw = await fetchWithLangFallback<Record<string, unknown>>(
        headerPath,
        effectiveLang,
        defaultLang,
      );

      if (headerRaw.status === 200) {
        const rawItem = (headerRaw.data as any)?.data ?? null;
        const attrs = rawItem?.attributes ?? {};
        const titleInfo = pickStringField(attrs, SHOP_HEADER_TITLE_FIELDS);
        const descInfo = pickStringField(attrs, SHOP_HEADER_DESC_FIELDS);

        header = {
          paragraphId: rawItem?.id ?? null,
          paragraphInternalId: attrs.drupal_internal__id ?? null,
          parentId: attrs.parent_id ?? null,
          bundle,
          title: titleInfo.value,
          description: descInfo.value,
          titleField: titleInfo.field,
          descriptionField: descInfo.field,
        };
      }
    }

    let body: ShopBodyData | null = null;
    if (bodyComponent?.id && bodyComponent?.type) {
      const bundle = getParagraphBundleName(bodyComponent.type);
      const bodyPath = `/jsonapi/paragraph/${bundle}/${bodyComponent.id}`;
      const bodyRaw = await fetchWithLangFallback<Record<string, unknown>>(
        bodyPath,
        effectiveLang,
        defaultLang,
      );

      if (bodyRaw.status === 200) {
        const rawItem = (bodyRaw.data as any)?.data ?? null;
        const attrs = rawItem?.attributes ?? {};
        const filtersInfo = pickListField(attrs, SHOP_BODY_FILTER_FIELDS);
        const sortsInfo = pickListField(attrs, SHOP_BODY_SORT_FIELDS);
        const itemsInfo = pickNumberField(attrs, SHOP_BODY_ITEMS_FIELDS);

        body = {
          paragraphId: rawItem?.id ?? null,
          paragraphInternalId: attrs.drupal_internal__id ?? null,
          parentId: attrs.parent_id ?? null,
          bundle,
          filters: filtersInfo.found ? filtersInfo.list : null,
          sorts: sortsInfo.found ? sortsInfo.list : null,
          itemsPerPage: itemsInfo.found ? itemsInfo.value : null,
          filtersField: filtersInfo.field,
          sortsField: sortsInfo.field,
          itemsPerPageField: itemsInfo.field,
        };
      }
    }

    return {
      pageId: page.id ?? undefined,
      pageInternalId,
      header,
      body,
    };
  } catch (err) {
    console.error('[Shop] Error getShopPageData:', err);
  }
  return null;
}

// ── About Page Paragraphs ─────────────────────────────────────────────────────

export async function getAboutHeroData(lang?: Lang): Promise<AboutHeroData | null> {
  try {
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const paramsBase = new DrupalJsonApiParams();
    paramsBase
      .addFields('paragraph--_component_about_hero', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_hero?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

    const baseRawData = baseRaw.data as any;
    const rawItem = baseRawData?.data?.[0];
    const parentId = rawItem?.attributes?.parent_id ?? null;

    const baseResult = dataFormatter.deserialize(baseRaw.data) as any[];
    const p = baseResult?.[0];
    if (!p) return null;

    let fotoUrl: string | null = null;
    const mediaRef = p.field_head_photo as any;
    if (mediaRef?.id) {
      const mediaRaw = await nodehiveFetch<Record<string, unknown>>(
        `/jsonapi/media/image/${mediaRef.id}?include=field_media_image&fields[media--image]=field_media_image&fields[file--file]=uri`,
        { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
      );
      if (mediaRaw.status === 200) {
        const mediaResult = dataFormatter.deserialize(mediaRaw.data) as any;
        const file = mediaResult?.field_media_image;
        if (file?.uri?.url) fotoUrl = `${NODEHIVE_BASE_URL}${file.uri.url}`;
      }
    }

    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      parentId,
      title: p.field_title ?? null,
      subtitle: p.field_subtitle ?? null,
      fotoUrl,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutHeroData:', err);
  }
  return null;
}

export async function getAboutStoryData(lang?: Lang): Promise<AboutStoryData | null> {
  try {
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const paramsBase = new DrupalJsonApiParams();
    paramsBase
      .addFields('paragraph--_component_about_story', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle_primary', 'field_description_long', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_story?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

    const baseRawData = baseRaw.data as any;
    const rawItem = baseRawData?.data?.[0];
    const parentId = rawItem?.attributes?.parent_id ?? null;

    const baseResult = dataFormatter.deserialize(baseRaw.data) as any[];
    const p = baseResult?.[0];
    if (!p) return null;

    let fotoUrl: string | null = null;
    const mediaRef = p.field_head_photo as any;
    if (mediaRef?.id) {
      const mediaRaw = await nodehiveFetch<Record<string, unknown>>(
        `/jsonapi/media/image/${mediaRef.id}?include=field_media_image&fields[media--image]=field_media_image&fields[file--file]=uri`,
        { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
      );
      if (mediaRaw.status === 200) {
        const mediaResult = dataFormatter.deserialize(mediaRaw.data) as any;
        const file = mediaResult?.field_media_image;
        if (file?.uri?.url) fotoUrl = `${NODEHIVE_BASE_URL}${file.uri.url}`;
      }
    }

    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      parentId,
      title: p.field_title ?? null,
      subtitle: p.field_subtitle_primary ?? null,
      description: p.field_description_long ?? null,
      fotoUrl,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutStoryData:', err);
  }
  return null;
}

export async function getAboutArchievementsData(lang?: Lang): Promise<AboutArchievementsData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_archievements', 'field_archievements.field_head_photo', 'field_archievements.field_head_photo.field_media_image'])
      .addFields('paragraph--_component_about_archievements', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_archievements',
      ])
      .addFields('paragraph--about_archivement', ['id', 'drupal_internal__id', 'field_title', 'field_head_photo'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_about_archievements?${params.getQueryString()}`;
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      lang: effectiveLang,
    });

    if (raw.status !== 200) return null;

    const rawItem = (raw.data as any)?.data?.[0];
    const parentId = rawItem?.attributes?.parent_id ?? null;

    const result = dataFormatter.deserialize(raw.data) as any[];
    const p = result?.[0];
    if (!p || !rawItem) return null;

    const relData = rawItem?.relationships?.field_archievements?.data ?? [];
    const rels = Array.isArray(relData) ? relData : relData ? [relData] : [];
    const usesParagraphs = rels.some((ref: any) => typeof ref?.type === 'string' && ref.type.startsWith('paragraph--'));

    let items: AboutArchievementsData['items'] = [];

    if (usesParagraphs) {
      const items_from_api = (p.field_archievements ?? []);
      items = await Promise.all(items_from_api.map(async (arch: any, index: number) => {
        let fotoUrl: string | null = null;
        const media = arch.field_head_photo as any;
        if (media) {
          fotoUrl = nodehiveMediaUrl(media, NODEHIVE_BASE_URL);
          if (!fotoUrl && media.field_media_image?.uri?.url) {
            fotoUrl = `${NODEHIVE_BASE_URL}${media.field_media_image.uri.url}`;
          } else if (!fotoUrl && media.uri?.url) {
            fotoUrl = `${NODEHIVE_BASE_URL}${media.uri.url}`;
          }
        }
        return {
          id: arch.id ?? String(index),
          internalId: arch.drupal_internal__id ?? index + 1,
          title: arch.field_title ?? '',
          description: '',
          icon: fotoUrl ?? '✨',
          fotoUrl,
        };
      }));
    }

    if (items.length === 0) {
      const isEn = effectiveLang === 'en';
      items = [
        { id: 'amazon', internalId: 1, title: 'Amazon Influencer', description: isEn ? 'approved' : 'aprobada', icon: '📦', fotoUrl: null as string | null },
        { id: 'hotmart', internalId: 2, title: isEn ? 'Floral design courses' : 'Cursos de diseño floral', description: 'Hotmart', icon: '🔥', fotoUrl: null as string | null },
        { id: 'vip', internalId: 3, title: isEn ? 'Active VIP community of entrepreneurial women' : 'Comunidad VIP activa de\r\nalumnas emprendedoras', description: '', icon: '👑', fotoUrl: null as string | null },
      ];
    }

    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      parentId,
      title: p.field_title ?? null,
      items,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutArchievementsData:', err);
  }
  return null;
}

export async function getAboutCertificactionData(lang?: Lang): Promise<AboutCertificactionData | null> {
  try {
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const paramsBase = new DrupalJsonApiParams();
    paramsBase
      .addFields('paragraph--_component_about_certificaction', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_certificaction?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

    const baseRawData = baseRaw.data as any;
    const rawItem = baseRawData?.data?.[0];
    const parentId = rawItem?.attributes?.parent_id ?? null;

    const baseResult = dataFormatter.deserialize(baseRaw.data) as any[];
    const p = baseResult?.[0];
    if (!p) return null;

    let fotoUrl: string | null = null;
    const mediaRef = p.field_head_photo as any;
    if (mediaRef?.id) {
      const mediaRaw = await nodehiveFetch<Record<string, unknown>>(
        `/jsonapi/media/image/${mediaRef.id}?include=field_media_image&fields[media--image]=field_media_image&fields[file--file]=uri`,
        { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
      );
      if (mediaRaw.status === 200) {
        const mediaResult = dataFormatter.deserialize(mediaRaw.data) as any;
        const file = mediaResult?.field_media_image;
        if (file?.uri?.url) fotoUrl = `${NODEHIVE_BASE_URL}${file.uri.url}`;
      }
    }

    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      parentId,
      title: p.field_title ?? null,
      subtitle: p.field_subtitle ?? null,
      fotoUrl,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutCertificactionData:', err);
  }
  return null;
}

export async function getAboutIdentityData(lang?: Lang): Promise<AboutIdentityData | null> {
  try {
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const paramsBase = new DrupalJsonApiParams();
    paramsBase
      .addFields('paragraph--_component_about_identity', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle_primary', 'field_identities',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_identity?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

    const rawData = baseRaw.data as any;
    const parentItem = rawData?.data?.[0];
    if (!parentItem) return null;

    const parentAttrs = parentItem.attributes ?? {};
    const childRefs: Array<{id: string}> = parentItem.relationships?.field_identities?.data ?? [];
    const parentId = parentAttrs.parent_id ?? null;

    const colors = ['pink', 'green'] as const;
    let tags: AboutIdentityData['tags'] = [];

    if (childRefs.length > 0) {
      const childParams = new DrupalJsonApiParams();
      childParams.addFields('paragraph--identity', ['id', 'drupal_internal__id', 'field_title']);
      const childRaw = await nodehiveFetch<Record<string, unknown>>(
        `/jsonapi/paragraph/identity?${childParams.getQueryString()}&page[limit]=50`,
        { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
      );
      if (childRaw.status === 200) {
        const allChildren = dataFormatter.deserialize(childRaw.data) as any[];
        const childMap = new Map(allChildren.map((c: any) => [c.id, c]));
        tags = childRefs
          .map((ref: any, i: number) => {
            const child = childMap.get(ref.id);
            if (!child) return null;
            return {
              id: child.id ?? String(i),
              internalId: child.drupal_internal__id ?? i,
              label: child.field_title ?? '',
              color: colors[i % 2],
            };
          })
          .filter(Boolean) as AboutIdentityData['tags'];
      }
    }

    return {
      paragraphId: parentAttrs.id ?? parentItem.id ?? null,
      paragraphInternalId: parentAttrs.drupal_internal__id ?? null,
      parentId,
      title: parentAttrs.field_title ?? null,
      subtitle: parentAttrs.field_subtitle_primary ?? null,
      tags,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutIdentityData:', err);
  }
  return null;
}



export async function getAboutObjectifsData(lang?: Lang): Promise<AboutObjectifsData | null> {
  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude([
        'field_objetives',
        'field_objetives.field_head_photo',
        'field_objetives.field_head_photo.field_media_image',
      ])
      .addFields('paragraph--_component_about_objetives', [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_objetives',
      ])
      .addFields('paragraph--about_objetive', [
        'id', 'drupal_internal__id', 'field_title', 'field_description', 'field_description_long', 'field_head_photo',
      ])
      .addFields('media--image', ['name', 'field_media_image'])
      .addFields('file--file', ['filename', 'uri'])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_about_objetives?${params.getQueryString()}`;
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      lang: effectiveLang,
    });

    if (raw.status !== 200) return null;

    const rawItem = (raw.data as any)?.data?.[0];
    const parentId = rawItem?.attributes?.parent_id ?? null;
    const result = dataFormatter.deserialize(raw.data) as any[];
    const p = result?.[0];
    if (!p) return null;

    const items: AboutObjectiveItem[] = (Array.isArray(p.field_objetives) ? p.field_objetives : []).map((obj: any) => {
      let fotoUrl: string | null = null;
      const media = obj.field_head_photo as any;
      if (media) {
        fotoUrl = nodehiveMediaUrl(media, NODEHIVE_BASE_URL);
        if (!fotoUrl && media.field_media_image?.uri?.url) {
          fotoUrl = `${NODEHIVE_BASE_URL}${media.field_media_image.uri.url}`;
        } else if (!fotoUrl && media.uri?.url) {
          fotoUrl = `${NODEHIVE_BASE_URL}${media.uri.url}`;
        }
      }
      return {
        id: obj.id ?? '',
        internalId: obj.drupal_internal__id ?? null,
        title: obj.field_title ?? null,
        description: obj.field_description_long ?? obj.field_description ?? null,
        fotoUrl,
      };
    });

    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      parentId,
      title: p.field_title ?? null,
      items,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutObjectifsData:', err);
  }
  return null;
}

// ── Auth Page Data ────────────────────────────────────────────────────────────

const AUTH_LEFT_HINTS = [
  'left_content',
  'login_left',
  'register_left',
  'login_hero',
  'register_hero',
  'hero',
  'panel',
];
const AUTH_RIGHT_HINTS = [
  'right_side',
  'login_right',
  'register_right',
  'login_form',
  'register_form',
  'form',
];

export async function getAuthPageData(
  pageSlug: 'login' | 'register' | 'forgot-password',
  lang?: Lang,
): Promise<AuthPageData | null> {
  const defaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? defaultLang;

  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'field_component', 'drupal_internal__nid'])
      .addPageLimit(30);

    const raw = await fetchWithLangFallback<Record<string, unknown>>(
      `/jsonapi/node/content_page?${params.getQueryString()}`,
      effectiveLang,
      defaultLang,
    );
    if (raw.status !== 200) {
      console.error(`[Auth] HTTP ${raw.status} fetching content_page`);
      return null;
    }

    const pages = (dataFormatter.deserialize(raw.data) as any[]) ?? [];

    const titles = pageSlug === 'login'
      ? ['login', 'iniciar sesión', 'iniciar sesion', 'sign in']
      : pageSlug === 'register'
        ? ['register', 'registro', 'crear cuenta', 'create account']
        : ['forgot', 'recuperar', 'recuperación', 'contrasena', 'password reset'];

    const page = pages.find((p: any) => {
      const t = (p.title ?? '').toLowerCase();
      return titles.some((s) => t.includes(s));
    });
    if (!page) return null;

    const rawData = raw.data as any;
    const rawPage = rawData?.data?.find((p: any) => p.id === page.id);
    const pageInternalId = rawPage?.attributes?.drupal_internal__nid ?? null;

    const components: any[] = Array.isArray(page.field_component) ? page.field_component : [];

    const leftComp = components.find((c: any) =>
      matchesHints(c.type ?? '', AUTH_LEFT_HINTS)
    ) ?? components[0] ?? null;

    const rightComp = components.find((c: any) =>
      c !== leftComp && matchesHints(c.type ?? '', AUTH_RIGHT_HINTS)
    ) ?? components[1] ?? null;

    let heroPanel: AuthHeroPanelData | null = null;
    if (leftComp?.id && leftComp?.type) {
      const bundle = getParagraphBundleName(leftComp.type);
      const leftParams = new DrupalJsonApiParams();
      leftParams
        .addInclude(['field_head_photo', 'field_head_photo.field_media_image'])
        .addFields(`paragraph--${bundle}`, [
          'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_description_long', 'field_head_photo',
        ])
        .addFields('media--image', ['name', 'field_media_image'])
        .addFields('file--file', ['filename', 'uri']);

      const leftRaw = await fetchWithLangFallback<Record<string, unknown>>(
        `/jsonapi/paragraph/${bundle}/${leftComp.id}?${leftParams.getQueryString()}`,
        effectiveLang,
        defaultLang,
      );
      if (leftRaw.status === 200) {
        const d = dataFormatter.deserialize(leftRaw.data) as any;
        const rawAttrs = (leftRaw.data as any)?.data?.attributes ?? {};

        let fotoUrl: string | null = null;
        if (d?.field_head_photo) {
          fotoUrl = nodehiveMediaUrl(d.field_head_photo, NODEHIVE_BASE_URL);
        }

        heroPanel = {
          paragraphId: d?.id ?? null,
          paragraphInternalId: rawAttrs.drupal_internal__id ?? null,
          parentId: rawAttrs.parent_id ?? null,
          bundle,
          title: d?.field_title ?? null,
          description: d?.field_description_long ?? null,
          fotoUrl,
        };
      }
    }

    let formHeader: AuthFormHeaderData | null = null;
    if (rightComp?.id && rightComp?.type) {
      const bundle = getParagraphBundleName(rightComp.type);
      const rightParams = new DrupalJsonApiParams();
      rightParams.addFields(`paragraph--${bundle}`, [
        'id', 'drupal_internal__id', 'parent_id', 'field_title', 'field_subtitle',
      ]);

      const rightRaw = await fetchWithLangFallback<Record<string, unknown>>(
        `/jsonapi/paragraph/${bundle}/${rightComp.id}?${rightParams.getQueryString()}`,
        effectiveLang,
        defaultLang,
      );
      if (rightRaw.status === 200) {
        const d = dataFormatter.deserialize(rightRaw.data) as any;
        const rawAttrs = (rightRaw.data as any)?.data?.attributes ?? {};
        formHeader = {
          paragraphId: d?.id ?? null,
          paragraphInternalId: rawAttrs.drupal_internal__id ?? null,
          parentId: rawAttrs.parent_id ?? null,
          bundle,
          title: d?.field_title ?? null,
          subtitle: d?.field_subtitle ?? null,
        };
      }
    }

    return { pageId: page.id, pageInternalId, heroPanel, formHeader };
  } catch (err) {
    console.error('[Auth] Error getAuthPageData:', err);
  }
  return null;
}
