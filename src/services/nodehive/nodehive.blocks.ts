// src/services/nodehive/nodehive.blocks.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import { nodehiveFileUrl, nodehiveMediaUrl, type NodeHiveFile, type CategoryNode } from '@/types/nodehive';
import type { Lang } from '@/i18n/ui';
import type {
  HeroData,
  HeroSlide,
  PersonalizationData,
  ServiciosData,
  ComentariosData,
} from '../../types/nodehive/content';

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
  const contactData = await getContactBlockData(lang);
  
  if (!contactData) return null;

  return {
    titulo: contactData.titulo,
    descripcion: contactData.descripcion,
    fotoUrl: contactData.fotoUrl,
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
  const blockData = await getCommentsBlockData(lang);
  
  if (!blockData) return null;

  const comentarios = blockData.comentarios.map((com) => ({
    nombre: com.nombre,
    rol: com.rol ?? null,
    comentario: com.comentario,
    calificacion: com.calificacion,
  }));

  return {
    titulo: blockData.titulo,
    descripcion: blockData.subTitulo,
    comentarios,
  };
}

// ── Homepage Categories Section ─────────────────────────────────────────────

export interface CategoryBlockData {
  blockId: string | null;
  titulo: string | null;
  subTitulo: string | null;
  categorias: Array<{
    id: string;
    nombre: string;
    slug: string;
    imagen: string | null;
  }>;
}

interface CategorysHomeBlock extends BlockContentBase {
  type: 'block_content--categorys_home';
  field_title: string | null;
  field_subtitle: string | null;
  field_categories: CategoryNode[];
}

export async function getCategoryBlockData(lang?: Lang): Promise<CategoryBlockData | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(['field_categories', 'field_categories.field_photo', 'field_categories.field_photo.field_media_image'])
    .addFields('block_content--categorys_home', ['id', 'field_title', 'field_subtitle', 'field_categories'])
    .addFields('node--category', ['id', 'title', 'field_name', 'field_photo'])
    .addFields('media--image', ['name', 'field_media_image'])
    .addFields('file--file', ['filename', 'uri'])
    .addPageLimit(1);

  const path = `/jsonapi/block_content/categorys_home?${apiParams.getQueryString()}`;

  let raw;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error('[Blocks] Error fetching categorys_home:', err);
    return null;
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return null;
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    const block = (Array.isArray(result) ? result[0] : result) as CategorysHomeBlock | undefined;

    if (!block) return null;

    const categorias = (block.field_categories ?? []).map((cat) => ({
      id: cat.id,
      nombre: cat.field_name ?? cat.title ?? '',
      slug: encodeURIComponent((cat.field_name ?? cat.title ?? '').toLowerCase().replace(/\s+/g, '-')),
      imagen: cat.field_photo ? nodehiveMediaUrl(cat.field_photo, NODEHIVE_BASE_URL) : null,
    }));

    return {
      blockId: block.id,
      titulo: block.field_title,
      subTitulo: block.field_subtitle,
      categorias,
    };
  } catch (err) {
    console.error('[Blocks] Error al deserializar categorys_home:', err);
    return null;
  }
}

// ── Homepage Contact Section ──────────────────────────────────────────────────

interface ContactHomeBlock extends BlockContentBase {
  type: 'block_content--contact_home';
  field_title: string | null;
  field_subtitle: string | null;
  field_description: string | null;
  field_photo: NodeHiveMedia[];
  field_button: ButtonParagraph[];
}

export interface ContactBlockData {
  blockId: string | null;
  titulo: string | null;
  subTitulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

export async function getContactBlockData(lang?: Lang): Promise<ContactBlockData | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(['field_photo', 'field_photo.field_media_image', 'field_button'])
    .addFields('block_content--contact_home', ['id', 'field_title', 'field_subtitle', 'field_description', 'field_photo', 'field_button'])
    .addFields('media--image', ['name', 'field_media_image'])
    .addFields('file--file', ['filename', 'uri'])
    .addFields('paragraph--button', ['field_button_text', 'field_button_link', 'field_button_style'])
    .addPageLimit(1);

  const path = `/jsonapi/block_content/contact_home?${apiParams.getQueryString()}`;

  let raw;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error('[Blocks] Error fetching contact_home:', err);
    return null;
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return null;
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
const block = (Array.isArray(result) ? result[0] : result) as ContactHomeBlock | undefined;

    if (!block) return null;

    // Normalize: single object vs array
    const fotoArray = Array.isArray(block.field_photo) ? block.field_photo : block.field_photo ? [block.field_photo] : [];
    const buttonArray = Array.isArray(block.field_button) ? block.field_button : block.field_button ? [block.field_button] : [];

    const fotoUrl = fotoArray[0] ? nodehiveMediaUrl(fotoArray[0], NODEHIVE_BASE_URL) : null;
    const ctaText = buttonArray[0]?.field_button_text ?? null;
    const ctaUrl = buttonArray[0]?.field_button_link?.uri ?? null;

    console.log('[Blocks] fotoUrl:', fotoUrl, 'ctaText:', ctaText, 'ctaUrl:', ctaUrl);

    return {
      blockId: block.id,
      titulo: block.field_title,
      subTitulo: block.field_subtitle,
      descripcion: block.field_description,
      fotoUrl,
      ctaText,
      ctaUrl,
    };
  } catch (err) {
    console.error('[Blocks] Error al deserializar contact_home:', err);
    return null;
  }
}

// ── Homepage Featured Products Section ─────────────────────────────────────

export interface FeaturedProduct {
  id: string;
  title: string;
  price: string;
  thumbnail: string | null;
  color: string | null;
  tipo: string | null;
  url: string;
}

export interface FeaturedProductsData {
  blockId: string | null;
  titulo: string | null;
  productos: FeaturedProduct[];
}

interface ProductsHomeBlock extends BlockContentBase {
  type: 'block_content--products_home';
  field_title: string | null;
  field_products: Array<{
    type: string;
    id: string;
    title: string;
    variations: Array<{
      price: { formatted: string };
      field_color: { type: string; id: string; name?: string } | null;
      field_type: string | null;
      field_gallery_of_photos: Array<{
        type: string;
        id: string;
        field_media_image: {
          type: string;
          id: string;
          relationships?: {
            field_media_image?: {
              data: {
                attributes: {
                  uri: { url: string };
                };
              };
            };
          };
        };
      }>;
    }>;
  }>;
}

export async function getFeaturedProductsData(lang?: Lang): Promise<FeaturedProductsData | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude([
      'field_products',
      'field_products.variations',
      'field_products.variations.field_gallery_of_photos',
      'field_products.variations.field_gallery_of_photos.field_media_image',
      'field_products.variations.field_color',
    ])
    .addFields('block_content--products_home', ['id', 'field_title', 'field_products'])
    .addFields('commerce_product--flower', ['id', 'title', 'variations'])
    .addFields('commerce_product_variation--flower', ['id', 'sku', 'price', 'field_color', 'field_type', 'field_gallery_of_photos'])
    .addFields('media--image', ['name', 'field_media_image'])
    .addFields('file--file', ['filename', 'uri'])
    .addFields('taxonomy_term--colors', ['name'])
    .addPageLimit(1);

  const path = `/jsonapi/block_content/products_home?${apiParams.getQueryString()}`;

  let raw;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error('[Blocks] Error fetching products_home:', err);
    return null;
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return null;
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    const block = (Array.isArray(result) ? result[0] : result) as ProductsHomeBlock | undefined;

    if (!block || !block.field_products?.length) return null;

const productos: FeaturedProduct[] = block.field_products.map((product) => {
      // Handle single variation vs array
      const variations = Array.isArray(product.variations) ? product.variations : product.variations ? [product.variations] : [];
      const variation = variations[0];

      // Get gallery - handle single vs array
      const gallery = variation?.field_gallery_of_photos ? 
        (Array.isArray(variation.field_gallery_of_photos) ? variation.field_gallery_of_photos : [variation.field_gallery_of_photos]) : [];
      
      // Use nodehiveMediaUrl if available
      let thumbnail: string | null = null;
      for (const mediaWrapper of gallery) {
        if (mediaWrapper) {
          thumbnail = nodehiveMediaUrl(mediaWrapper as any, NODEHIVE_BASE_URL);
          if (thumbnail) break;
        }
      }

      // Handle field_color - can be direct object or relationship
      let color: string | null = null;
      if (variation?.field_color) {
        if (typeof variation.field_color === 'object' && variation.field_color !== null) {
          color = (variation.field_color as any).name ?? null;
        }
      }

      return {
        id: product.id,
        title: product.title ?? '',
        price: variation?.price?.formatted ?? '',
        thumbnail,
        color,
        tipo: variation?.field_type ?? null,
        url: `/${product.id}`,
      };
    });

    return {
      blockId: block.id,
      titulo: block.field_title,
      productos,
    };
  } catch (err) {
    console.error('[Blocks] Error al deserializar products_home:', err);
    return null;
  }
}

// ── Homepage Services Section ───────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
}

export interface ServicesBlockData {
  blockId: string | null;
  titulo: string | null;
  subTitulo: string | null;
  servicios: ServiceItem[];
}

interface ServicesBlock extends BlockContentBase {
  type: 'block_content--services';
  field_title: string | null;
  field_subtitle: string | null;
  field_services: Array<{
    type: string;
    id: string;
    title: string;
    field_name: string | null;
    field_description: string | null;
    field_photo: any;
  }>;
}

export async function getServicesBlockData(lang?: Lang): Promise<ServicesBlockData | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(['field_services', 'field_services.field_photo', 'field_services.field_photo.field_media_image'])
    .addFields('block_content--services', ['id', 'field_title', 'field_subtitle', 'field_services'])
    .addFields('node--services', ['id', 'title', 'field_name', 'field_description', 'field_photo'])
    .addFields('media--image', ['name', 'field_media_image'])
    .addFields('file--file', ['filename', 'uri'])
    .addPageLimit(1);

  const path = `/jsonapi/block_content/services?${apiParams.getQueryString()}`;

  let raw;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error('[Blocks] Error fetching services:', err);
    return null;
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return null;
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    const block = (Array.isArray(result) ? result[0] : result) as ServicesBlock | undefined;

    if (!block) return null;

    const servicios: ServiceItem[] = (block.field_services ?? []).map((service) => {
      let imagen: string | null = null;
      if (service.field_photo) {
        imagen = nodehiveMediaUrl(service.field_photo as any, NODEHIVE_BASE_URL);
      }

      return {
        id: service.id,
        titulo: service.field_name ?? service.title ?? '',
        descripcion: service.field_description ?? '',
        imagen,
      };
    });

    return {
      blockId: block.id,
      titulo: block.field_title,
      subTitulo: block.field_subtitle,
      servicios,
    };
  } catch (err) {
    console.error('[Blocks] Error al deserializar services:', err);
    return null;
  }
}

// ── Homepage Comments/Testimonials Section ─────────────────────────────────────

export interface TestimonialItem {
  id: string;
  nombre: string;
  rol: string;
  comentario: string;
  calificacion: number;
}

export interface CommentsBlockData {
  blockId: string | null;
  titulo: string | null;
  subTitulo: string | null;
  comentarios: TestimonialItem[];
}

interface CommentsBlock extends BlockContentBase {
  type: 'block_content--comments_home';
  field_title: string | null;
  field_subtitle: string | null;
  field_comment: Array<{
    type: string;
    id: string;
    title: string;
    field_person_name: string | null;
    field_person_rol: string | null;
    field_comment: string | null;
    field_calification: number | null;
  }>;
}

export async function getCommentsBlockData(lang?: Lang): Promise<CommentsBlockData | null> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(['field_comment'])
    .addFields('block_content--comments_home', ['id', 'field_title', 'field_subtitle', 'field_comment'])
    .addFields('node--comment', ['id', 'title', 'field_person_name', 'field_person_rol', 'field_comment', 'field_calification'])
    .addPageLimit(1);

  const path = `/jsonapi/block_content/comments_home?${apiParams.getQueryString()}`;

  let raw;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error('[Blocks] Error fetching comments:', err);
    return null;
  }

  if (raw.status !== 200) {
    console.error(`[Blocks] HTTP ${raw.status} en ${path}`);
    return null;
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    const block = (Array.isArray(result) ? result[0] : result) as CommentsBlock | undefined;

    if (!block) return null;

const comentarios: TestimonialItem[] = (block.field_comment ?? []).map((comment) => ({
      id: comment.id,
      nombre: comment.field_person_name ?? comment.title ?? '',
      rol: comment.field_person_rol ?? '',
      comentario: comment.field_comment ?? '',
      calificacion: comment.field_calification ?? 5,
    }));

    return {
      blockId: block.id,
      titulo: block.field_title,
      subTitulo: block.field_subtitle,
      comentarios,
    };
  } catch (err) {
    console.error('[Blocks] Error al deserializar comments:', err);
    return null;
  }
}