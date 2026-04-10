// src/types/commerce.ts

// ── Entidades base de Drupal ──────────────────────────────────────────────────

/**
 * Archivo de Drupal después de que Jsona aplana los attributes.
 * uri.url es relativa al base URL de Drupal (ej: /sites/default/files/foto.jpg)
 */
export interface DrupalFile {
  type: 'file--file';
  id: string;
  filename: string;
  uri: {
    value: string; // public://foto.jpg
    url: string;   // /sites/default/files/foto.jpg
  };
  filemime: string;
}

/**
 * Término de taxonomía del vocabulario Colores.
 * field_color_hex es opcional — agrégalo en Drupal si lo necesitás.
 */
export interface ColorTerm {
  type: 'taxonomy_term--colores';
  id: string;
  name: string;
  field_color_hex?: string; // ej: '#eb4763'
}

// ── Precio ────────────────────────────────────────────────────────────────────

export interface CommercePrice {
  number: string;
  currency_code: string;
  formatted: string; // ej: '$25.00'
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

/** Valores posibles para field_tipo en la variación flores_personalizadas */
export type FloresTipo = 'natural' | 'artificial' | 'seco';

/**
 * Variación concreta del tipo "flores_personalizadas".
 * field_galeria_de_fotos es un array porque el campo es Unlimited en Drupal.
 * field_color_de_la_flor es la referencia al term del vocabulario Colores.
 */
export interface FloresPersonalizadasVariation extends CommerceVariationBase {
  type: 'commerce_product_variation--flores_personalizadas';
  field_color_de_la_flor: ColorTerm;
  field_galeria_de_fotos: DrupalFile[];
  field_tipo: FloresTipo | null;
}

// ── Producto genérico ─────────────────────────────────────────────────────────

/**
 * Producto de Commerce genérico.
 * El parámetro V permite tipar la variación correcta según el tipo de producto.
 *
 * Uso:
 *   CommerceProduct<FloresPersonalizadasVariation>  → producto de flores
 *   CommerceProduct                                 → variación base (listados genéricos)
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
  variations: V[];
}

/** Alias concreto para el tipo de producto flores */
export type FloresProduct = CommerceProduct<FloresPersonalizadasVariation>;

// ── Helpers de imagen ─────────────────────────────────────────────────────────

/**
 * Convierte la URL relativa de un archivo de Drupal en absoluta.
 *
 * @param file    Objeto DrupalFile deserializado por Jsona
 * @param baseUrl Base URL de Drupal SIN trailing slash (ej: 'http://localhost:8080')
 */
export function drupalFileUrl(file: DrupalFile, baseUrl: string): string {
  return `${baseUrl}${file.uri.url}`;
}

/**
 * Devuelve la URL absoluta del primer archivo de la galería
 * de la primera variación del producto.
 * Útil para thumbnails en cards de listado.
 *
 * @returns URL absoluta o null si no hay imágenes
 */
export function getProductThumbnail(
  product: FloresProduct,
  baseUrl: string,
): string | null {
  const firstFile = product.variations?.[0]?.field_galeria_de_fotos?.[0];
  return firstFile ? drupalFileUrl(firstFile, baseUrl) : null;
}

/**
 * Devuelve todas las URLs absolutas de la galería de una variación.
 * Útil para galerías en páginas de detalle.
 */
export function getVariationGallery(
  variation: FloresPersonalizadasVariation,
  baseUrl: string,
): string[] {
  return (variation.field_galeria_de_fotos ?? []).map((f) =>
    drupalFileUrl(f, baseUrl),
  );
}