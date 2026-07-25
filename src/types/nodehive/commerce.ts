/**
 * Tipos de Commerce de NodeHive.
 * Productos, variaciones y precios.
 */

import type { ColorTerm, FlowerCategoryTerm, OccasionTerm, ProductTagTerm } from './taxonomy';
import type { NodeHiveMedia } from './base';

/**
 * Precio desde Commerce API.
 */
export interface CommercePrice {
  number: string;
  currency_code: string;
  formatted: string;
}

/**
 * Base que deben cumplir todas las variaciones de Commerce.
 */
export interface CommerceVariationBase {
  type: string;
  id: string;
  sku: string;
  title: string;
  price: CommercePrice;
  drupal_internal__variation_id?: number;
}

/**
 * Valores posibles para field_type en la variación flower.
 */
export type FlowerType = 'natural' | 'artificial' | 'dried' | 'seco';

/**
 * Variación concreta del tipo "flower".
 * field_gallery_of_photos es array (campo Unlimited).
 * field_color es la referencia al term del vocabulario Colors.
 */
export interface FlowerVariation extends CommerceVariationBase {
  type: 'commerce_product_variation--flower';
  field_color: ColorTerm | null;
  field_gallery_of_photos: NodeHiveMedia[];
  field_type: FlowerType | null;
}

/**
 * Producto de Commerce genérico.
 * El parámetro V permite tipar la variación correcta según el tipo.
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

/**
 * Alias concreto para el tipo de producto flower.
 */
export type FlowerProduct = CommerceProduct<FlowerVariation>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de imagen
// ─────────────────────────────────────────────────────────────────────────────

import { nodehiveMediaUrl } from './base';

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