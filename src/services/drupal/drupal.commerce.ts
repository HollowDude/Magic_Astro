// src/services/drupal/drupal.commerce.ts
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type {
  CommerceProduct,
  CommerceVariationBase,
  FloresPersonalizadasVariation,
  FloresProduct,
} from '@/types/commerce';

const dataFormatter = new Jsona();

// ── Configuración de tipos de producto ───────────────────────────────────────
//
// Para agregar un nuevo tipo de producto (ej: "plantas"):
//   1. Definí su entrada en PRODUCT_CONFIGS
//   2. Creá su interface de variación en commerce.ts
//   3. Exportá su helper tipado al final de este archivo
//
// El resto de la lógica es genérica y no requiere cambios.

interface ProductTypeConfig {
  /** Nombre del bundle en commerce_product (ej: 'flores') */
  productType: string;
  /** Nombre del bundle en commerce_product_variation (ej: 'flores_personalizadas') */
  variationType: string;
  /**
   * Relaciones a incluir en la respuesta JSON:API.
   * Notación con punto para relaciones anidadas.
   */
  includes: string[];
  /** Campos del producto a traer (sparse fieldsets) */
  productFields: string[];
  /** Campos de la variación a traer */
  variationFields: string[];
  /**
   * Campos de entidades relacionadas adicionales.
   * Clave: entity_type--bundle  |  Valor: array de campos
   */
  relatedFields?: Record<string, string[]>;
}

const PRODUCT_CONFIGS = {
  flores: {
    productType: 'flores',
    variationType: 'flores_personalizadas',
    includes: [
      'variations',
      'variations.field_galeria_de_fotos',   // File entities
      'variations.field_color_de_la_flor',   // Taxonomy term
    ],
    productFields: ['title', 'body', 'variations'],
    variationFields: [
      'sku',
      'price',
      'title',
      'field_color_de_la_flor',
      'field_galeria_de_fotos',
      'field_tipo',
    ],
    relatedFields: {
      // Solo pedimos los campos que necesitamos de cada entidad relacionada.
      // Esto reduce el payload considerablemente.
      'file--file':               ['filename', 'uri', 'filemime'],
      'taxonomy_term--colores':   ['name', 'field_color_hex'],
    },
  },
  // ── Ejemplo para un futuro tipo "plantas" ─────────────────────────────────
  // plantas: {
  //   productType: 'plantas',
  //   variationType: 'plantas_variacion',
  //   includes: ['variations', 'variations.field_imagen_principal'],
  //   productFields: ['title', 'body', 'variations'],
  //   variationFields: ['sku', 'price', 'title', 'field_imagen_principal'],
  //   relatedFields: {
  //     'file--file': ['filename', 'uri', 'filemime'],
  //   },
  // },
} satisfies Record<string, ProductTypeConfig>;

export type ProductTypeKey = keyof typeof PRODUCT_CONFIGS;

// ── Fetch genérico ────────────────────────────────────────────────────────────

/**
 * Obtiene productos de Drupal Commerce usando JSON:API.
 * Jsona deserializa la respuesta y aplana todas las relaciones incluidas.
 *
 * @param productTypeKey  Clave de PRODUCT_CONFIGS
 * @returns Array de productos con variaciones completamente deserializadas
 */
export async function getProducts<
  V extends CommerceVariationBase = CommerceVariationBase,
>(productTypeKey: ProductTypeKey): Promise<CommerceProduct<V>[]> {
  const config = PRODUCT_CONFIGS[productTypeKey];

  // ── Construir query JSON:API ────────────────────────────────────────────────
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addInclude(config.includes)
    .addFields(
      `commerce_product--${config.productType}`,
      config.productFields,
    )
    .addFields(
      `commerce_product_variation--${config.variationType}`,
      config.variationFields,
    );

  // Sparse fieldsets para cada entidad relacionada
  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/commerce_product/${config.productType}?${apiParams.getQueryString()}`;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  let raw: Awaited<ReturnType<typeof drupalFetch<Record<string, unknown>>>>;

  try {
    raw = await drupalFetch<Record<string, unknown>>(path, {
      headers: {
        // JSON:API requiere su propio Content-Type y Accept
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
    });
  } catch (err) {
    console.error('[Commerce] Error de red:', err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Commerce] HTTP ${raw.status} en ${path}`);
    return [];
  }

  // ── Deserializar ───────────────────────────────────────────────────────────
  // Jsona necesita el objeto completo { data: [...], included: [...] }
  // que es exactamente raw.data tras drupalFetch.
  try {
    return dataFormatter.deserialize(raw.data) as CommerceProduct<V>[];
  } catch (err) {
    console.error('[Commerce] Error al deserializar con Jsona:', err);
    return [];
  }
}

// ── Helpers tipados por tipo de producto ─────────────────────────────────────
//
// Cada helper devuelve el tipo concreto correcto sin necesidad de casteos
// en los componentes que los consumen.

/** Obtiene productos del tipo flores con variaciones flores_personalizadas */
export function getFloresProducts(): Promise<FloresProduct[]> {
  return getProducts<FloresPersonalizadasVariation>('flores');
}