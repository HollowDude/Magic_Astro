/**
 * Términos de taxonomía de NodeHive.
 * Se usan en productos, bloques y nodos.
 */

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
  drupal_internal__tid?: number;
  name?: string | null;
  weight?: number | null;
  status?: boolean;
}

/**
 * Nodo de tipo Category (del bloque categorys_home)
 */
export interface CategoryNode {
  type: 'node--category';
  id: string;
  title?: string;
  field_name?: string;
  field_photo?: unknown; // NodeHiveMedia, pero sin circular dependency
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