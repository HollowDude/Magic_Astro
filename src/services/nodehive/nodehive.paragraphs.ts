// src/services/nodehive/nodehive.paragraphs.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveMediaUrl } from '@/types/nodehive';
import type { NodeHiveFile } from '../../types/nodehive/base';
import type { Lang } from '../../i18n/ui';
import type { CategoryBlockData, FeaturedProductsData, ServicesBlockData, CommentsBlockData, ContactBlockData } from './nodehive.blocks';
import type { AboutHeroData, AboutStoryData, AboutArchievementsData, AboutCertificactionData, AboutIdentityData, AboutMisionData, AboutVisionData, AboutObjectifsData, AboutObjectiveItem } from '../../types/nodehive/content';

const dataFormatter = new Jsona();
const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
} as const;

export async function getHomepageHeroData(lang?: Lang): Promise<HeroData | null> {
  const nodeHiveDefaultLang = (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';
  const effectiveLang = lang ?? nodeHiveDefaultLang;

  try {
    const params = new DrupalJsonApiParams();
    params
      .addInclude(['field_component'])
      .addFields('node--content_page', ['id', 'title', 'field_component'])
      .addPageLimit(1);

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
    const page = nodeResult?.[0];
    if (!page?.field_component?.length) return null;

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

    const slides = (heroData.field_photos_slider ?? []).map((media: any) => ({
      image: nodehiveMediaUrl(media, NODEHIVE_BASE_URL) ?? '',
      label: media.name ?? 'Imagen',
    }));

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
      .addInclude(['field_categories.field_photo.field_media_image'])
      .addFields('paragraph--_component_home_categories', [
        'id', 'field_title', 'field_subtitle', 'field_categories',
      ])
      .addFields('node--category', ['id', 'name', 'drupal_internal__tid', 'field_slug', 'field_photo'])
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
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph) return null;

      const categorias = (paragraph.field_categories ?? []).map((cat: any) => ({
        id: cat.id ?? '',
        nombre: cat.name ?? '',
        slug: cat.field_slug ?? cat.drupal_internal__tid?.toString() ?? cat.id ?? '',
        imagen: cat.field_photo ? nodehiveMediaUrl(cat.field_photo, NODEHIVE_BASE_URL) : null,
      }));

      return {
        paragraphId: paragraph.id,
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
      .addFields('paragraph--_component_home_products', ['id', 'field_title', 'field_products'])
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

      return {
        paragraphId: paragraph.id,
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
      .addInclude(['field_services.field_photo.field_media_image'])
      .addFields('paragraph--_component_home_services', [
        'id', 'field_title', 'field_subtitle', 'field_subtitle_primary', 'field_services',
      ])
      .addFields('node--services', ['id', 'title', 'field_name', 'field_description', 'field_photo'])
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
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph) return null;

      const servicios = (paragraph.field_services ?? []).map((svc: any) => ({
        id: svc.id ?? '',
        titulo: svc.field_name ?? svc.title ?? '',
        descripcion: svc.field_description ?? '',
        imagen: svc.field_photo ? nodehiveMediaUrl(svc.field_photo, NODEHIVE_BASE_URL) : null,
      }));

      return {
        paragraphId: paragraph.id,
        titulo: paragraph.field_title ?? null,
        subTitulo: paragraph.field_subtitle ?? null,
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
        'id', 'field_title', 'field_subtitle', 'field_comments',
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
      const result = dataFormatter.deserialize(raw.data) as any[];
      const paragraph = result?.[0];
      if (!paragraph) return null;

      const comentarios = (paragraph.field_comments ?? []).map((c: any) => ({
        id: c.id ?? '',
        nombre: c.field_person_name ?? c.title ?? '',
        rol: c.field_person_rol ?? '',
        comentario: c.field_comment ?? '',
        calificacion: c.field_calification ?? 5,
      }));

      return {
        paragraphId: paragraph.id,
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
        'id', 'field_title', 'field_description', 'field_button', 'field_head_photo',
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

      return {
        paragraphId: paragraph.id,
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

// ── About Page Paragraphs ─────────────────────────────────────────────────────

export async function getAboutHeroData(lang?: Lang): Promise<AboutHeroData | null> {
  try {
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const paramsBase = new DrupalJsonApiParams();
    paramsBase
      .addFields('paragraph--_component_about_hero', [
        'id', 'drupal_internal__id', 'field_title', 'field_subtitle', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_hero?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

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
        'id', 'drupal_internal__id', 'field_title', 'field_subtitle_primary', 'field_description_long', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_story?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

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
      .addFields('paragraph--_component_about_archievements', [
        'id', 'drupal_internal__id', 'field_title',
      ])
      .addPageLimit(1);

    const path = `/jsonapi/paragraph/_component_about_archievements?${params.getQueryString()}`;
    const effectiveLang = lang ?? (import.meta.env.NODEHIVE_DEFAULT_LANG as string) ?? 'es';

    const raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      lang: effectiveLang,
    });

    if (raw.status !== 200) return null;

    const result = dataFormatter.deserialize(raw.data) as any[];
    const p = result?.[0];
    if (!p) return null;

    const isEn = effectiveLang === 'en';
    return {
      paragraphId: p.id ?? null,
      paragraphInternalId: p.drupal_internal__id ?? null,
      title: p.field_title ?? null,
      items: [
        { id: 'amazon', internalId: 1, title: 'Amazon Influencer', description: isEn ? 'approved' : 'aprobada', icon: '📦' },
        { id: 'hotmart', internalId: 2, title: isEn ? 'Floral design courses' : 'Cursos de diseño floral', description: 'Hotmart', icon: '🔥' },
        { id: 'vip', internalId: 3, title: isEn ? 'Active VIP community of entrepreneurial women' : 'Comunidad VIP activa de\r\nalumnas emprendedoras', description: '', icon: '👑' },
      ],
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
        'id', 'drupal_internal__id', 'field_title', 'field_subtitle', 'field_head_photo',
      ])
      .addPageLimit(1);

    const baseRaw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/paragraph/_component_about_certificaction?${paramsBase.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang: effectiveLang }
    );
    if (baseRaw.status !== 200) return null;

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
        'id', 'drupal_internal__id', 'field_title', 'field_subtitle_primary', 'field_identities',
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
      title: parentAttrs.field_title ?? null,
      subtitle: parentAttrs.field_subtitle_primary ?? null,
      tags,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutIdentityData:', err);
  }
  return null;
}

export async function getAboutMisionData(lang?: Lang): Promise<AboutMisionData | null> {
  const isEn = lang === 'en';
  return {
    paragraphId: null,
    paragraphInternalId: null,
    title: 'Misión',
    description: isEn
      ? 'Inspire and accompany entrepreneurial women to discover their floral talent, transform it into art and convert it into a sustainable business through practical, creative education based on real experience.'
      : 'Inspirar y acompañar a mujeres emprendedoras a descubrir su talento floral, transformarlo en arte y convertirlo en un negocio sostenible mediante educación práctica, creativa y basada en la experiencia real.',
    fotoUrl: null,
  };
}

export async function getAboutVisionData(lang?: Lang): Promise<AboutVisionData | null> {
  const isEn = lang === 'en';
  return {
    paragraphId: null,
    paragraphInternalId: null,
    title: 'Visión',
    description: isEn
      ? 'To be a global reference brand in artificial and natural floral design, recognized for its creativity, high-value teaching, digital products and floral designs that emotionally connect with every person.'
      : 'Ser una marca global referente en diseño floral artificial y natural, reconocida por su creatividad, enseñanza de alto valor, productos digitales y diseños florales que conectan emocionalmente con cada persona.',
    fotoUrl: null,
  };
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
        'id', 'drupal_internal__id', 'field_title', 'field_objetives',
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
      title: p.field_title ?? null,
      items,
    };
  } catch (err) {
    console.error('[Paragraphs] Error getAboutObjectifsData:', err);
  }
  return null;
}
