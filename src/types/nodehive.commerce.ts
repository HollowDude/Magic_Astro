// src/types/nodehive.commerce.ts

// ── Entidades base de NodeHive ────────────────────────────────────────────────

/**
 * Media de tipo Image después de que Jsona aplana los attributes.
 */
export interface NodeHiveMedia {
  type: 'media--image';
  id: string;
  name: string;
  field_media_image?: {
    type: 'file--file';
    id: string;
    filename: string;
    uri: {
      value: string;
      url: string;
    };
    filemime: string;
  };
}

/**
 * Archivo de NodeHive después de que Jsona aplana los attributes.
 * uri.url es relativa al base URL (ej: /sites/default/files/foto.jpg)
 */
export interface NodeHiveFile {
  type: 'file--file';
  id: string;
  filename: string;
  uri: {
    value: string;
    url: string;
  };
  filemime: string;
}

/**
 * Término de taxonomía del vocabulario Colors.
 */
export interface ColorTerm {
  type: 'taxonomy_term--colors';
  id: string;
  name: string;
  field_color_hex?: string;
}

/**
 * Término de taxonomía del vocabulario Flower Category.
 */
export interface FlowerCategoryTerm {
  type: 'taxonomy_term--flower_category';
  id: string;
  drupal_internal__tid: number;
  name: string;
  weight: number;
  status: boolean;
}

/**
 * Término de taxonomía del vocabulario Occasions.
 */
export interface OccasionTerm {
  type: 'taxonomy_term--occasions';
  id: string;
  name: string;
}

/**
 * Término de taxonomía del vocabulario Products Tag.
 */
export interface ProductTagTerm {
  type: 'taxonomy_term--products_tag';
  id: string;
  name: string;
}

// ── Precio ────────────────────────────────────────────────────────────────────

export interface CommercePrice {
  number: string;
  currency_code: string;
  formatted: string;
}

// ── Variaciones ───────────────────────────────────────────────────────────────

/** Base que deben cumplir todas las variaciones de Commerce */
export interface CommerceVariationBase {
  type: string;
  id: string;
  sku: string;
  title: string;
  price: CommercePrice;
}

/** Valores posibles para field_type en la variación flower */
export type FlowerType = 'natural' | 'artificial' | 'dried';

/**
 * Variación concreta del tipo "flower".
 * field_gallery_of_photos es un array porque el campo es Unlimited.
 * field_color es la referencia al term del vocabulario Colors.
 */
export interface FlowerVariation extends CommerceVariationBase {
  type: 'commerce_product_variation--flower';
  field_color: ColorTerm | null;
  field_gallery_of_photos: NodeHiveMedia[];
  field_type: FlowerType | null;
}

// ── Producto ──────────────────────────────────────────────────────────────────

/**
 * Producto de Commerce genérico.
 * El parámetro V permite tipar la variación correcta según el tipo de producto.
 */
export interface CommerceProduct<V extends CommerceVariationBase = CommerceVariationBase> {
  type: string;
  id: string;
  title: string;
  body?: {
    value: string;
    format: string;
    processed: string;
  };
  field_category?: FlowerCategoryTerm | null;
  field_description?: string;
  field_ocasion?: OccasionTerm[];
  field_tag?: ProductTagTerm[];
  variations: V[];
}

/** Alias concreto para el tipo de producto flower */
export type FlowerProduct = CommerceProduct<FlowerVariation>;

// ── Helpers de imagen ─────────────────────────────────────────────────────────

/**
 * Convierte la URL relativa de un archivo de NodeHive en absoluta.
 *
 * @param file    Objeto NodeHiveFile deserializado por Jsona
 * @param baseUrl Base URL de NodeHive SIN trailing slash
 */
export function nodehiveFileUrl(file: NodeHiveFile, baseUrl: string): string {
  return `${baseUrl}${file.uri.url}`;
}

/**
 * Convierte la URL relativa de un media de NodeHive en absoluta.
 */
export function nodehiveMediaUrl(media: NodeHiveMedia, baseUrl: string): string | null {
  if (!media.field_media_image) return null;
  return nodehiveFileUrl(media.field_media_image, baseUrl);
}

/**
 * Devuelve la URL absoluta del primer media de la galería
 * de la primera variación del producto.
 *
 * @returns URL absoluta o null si no hay imágenes
 */
export function getProductThumbnail(
  product: FlowerProduct,
  baseUrl: string,
): string | null {
  const firstMedia = product.variations?.[0]?.field_gallery_of_photos?.[0];
  return firstMedia ? nodehiveMediaUrl(firstMedia, baseUrl) : null;
}

/**
 * Devuelve todas las URLs absolutas de la galería de una variación.
 */
export function getVariationGallery(
  variation: FlowerVariation,
  baseUrl: string,
): string[] {
  return (variation.field_gallery_of_photos ?? [])
    .map((m) => nodehiveMediaUrl(m, baseUrl))
    .filter((url): url is string => url !== null);
}