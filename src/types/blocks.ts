
// Tipos para block_content de Drupal (custom block types).
// Reutiliza DrupalFile de commerce.ts para no duplicar.

import type { DrupalFile } from '@/types/commerce';

// ── Base ──────────────────────────────────────────────────────────────────────

export interface BlockContentBase {
  type: string;
  id: string;
  drupal_internal__id: number;
  info: string;   // "Admin title" del bloque en Drupal
  status: boolean;
}

// ── Bloques concretos ─────────────────────────────────────────────────────────
//
// Convención de nombres: un interface por block type, con el machine name
// del bundle como sufijo del `type` literal.
// Agregar aquí cada nuevo block type que se cree en Drupal.

/**
 * Block type: Homepage Hero Section
 * Bundle machine name: homepage_hero_section
 *
 * Campos:
 *   field_bienvenida        → Text (plain) — título principal
 *   field_eslogan           → Text (plain) — subtítulo opcional
 *   field_descripcion       → Text (plain, long) — párrafo descriptivo
 *   field_carrusel_de_fotos → Image (hasta 6) — slides del carrusel
 */
export interface HomepageHeroBlock extends BlockContentBase {
  type: 'block_content--homepage_hero_section';
  field_bienvenida: string;
  field_eslogan: string | null;
  field_descripcion: string;
  field_carrusel_de_fotos: DrupalFile[];
}

// ── Forma normalizada para el componente ──────────────────────────────────────
// Desacoplada de Drupal para que el componente no dependa de la API.

export interface HeroSlide {
  image: string;   // URL absoluta
  label: string;   // alt text / aria-label
}

export interface HeroData {
  title: string;
  slogan: string | null;
  description: string;
  slides: HeroSlide[];
}