// src/types/blocks.ts
//
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

// ─────────────────────────────────────────────────────────────────────────────
// BLOQUES CONCRETOS
// Convención: un interface por block type, con el machine name del bundle.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Block type: Homepage Hero Section
 * Bundle machine name: homepage_hero_section
 *
 * Campos:
 *   field_bienvenida        → Text (plain)      — título principal (requerido)
 *   field_eslogan           → Text (plain)      — subtítulo (opcional)
 *   field_descripcion       → Text (plain,long) — párrafo descriptivo (requerido)
 *   field_carrusel_de_fotos → Image (hasta 6)   — slides del carrusel
 */
export interface HomepageHeroBlock extends BlockContentBase {
  type: 'block_content--homepage_hero_section';
  field_bienvenida: string;
  field_eslogan: string | null;
  field_descripcion: string;
  field_carrusel_de_fotos: DrupalFile[];
}

/**
 * Block type: Homepage Personalization Section
 * Bundle machine name: homepage_personalization_section
 *
 * Campos:
 *   field_titulo        → Text (plain)      — título (opcional)
 *   field_descripcion_ps→ Text (plain,long) — descripción (requerido)
 *   field_foto          → Image (único)     — foto decorativa (opcional)
 */
export interface HomepagePersonalizationBlock extends BlockContentBase {
  type: 'block_content--homepage_personalization_section';
  field_titulo: string | null;
  field_descripcion_ps: string;
  field_foto: DrupalFile | null;
}

/**
 * Block type: Homepage Servicios Section
 * Bundle machine name: homepage_servicios_section
 *
 * Campos:
 *   field_titulo_ss    → Text (plain) — eyebrow/título (opcional)
 *   field_sub_titulo_ss→ Text (plain) — título principal (requerido)
 *   field_eslogan_ss   → Text (plain) — subtítulo descriptivo (opcional)
 */
export interface HomepageServiciosBlock extends BlockContentBase {
  type: 'block_content--homepage_servicios_section';
  field_titulo_ss: string | null;
  field_sub_titulo_ss: string;
  field_eslogan_ss: string | null;
}

/**
 * Content type: Comentario
 * Machine name: comentario
 *
 * Entidad independiente referenciada por HomepageComentariosBlock.
 * Debe crearse como nodo antes de poder asociarse al bloque.
 *
 * Campos:
 *   field_nombre_persona      → Text (plain)      — nombre (requerido)
 *   field_role_de_la_persona  → Text (plain)      — rol (opcional)
 *   field_comentario          → Text (plain,long) — testimonio (requerido)
 */
export interface ComentarioNode {
  type: 'node--comentario';
  id: string;
  field_nombre_persona: string;
  field_role_de_la_persona: string | null;
  field_comentario: string;
}

/**
 * Block type: Homepage Comentarios Section
 * Bundle machine name: homepage_comentarios_section
 *
 * Campos:
 *   field_titulo_cs     → Text (plain)      — título (requerido)
 *   field_descripcion_cs→ Text (plain)      — descripción (requerido)
 *   field_comentarios   → Entity Reference  — refs a nodos Comentario (máx. 3)
 */
export interface HomepageComentariosBlock extends BlockContentBase {
  type: 'block_content--homepage_comentarios_section';
  field_titulo_cs: string;
  field_descripcion_cs: string;
  field_comentarios: ComentarioNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAS NORMALIZADAS PARA LOS COMPONENTES
// Desacopladas de Drupal para que los componentes no dependan de la API.
// ─────────────────────────────────────────────────────────────────────────────

// ── Hero ──────────────────────────────────────────────────────────────────────
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

// ── Personalization ───────────────────────────────────────────────────────────
export interface PersonalizationData {
  titulo: string | null;
  descripcion: string;
  fotoUrl: string | null;
}

// ── Servicios ─────────────────────────────────────────────────────────────────
export interface ServiciosData {
  titulo: string | null;       // eyebrow label
  subTitulo: string;           // h2 principal
  eslogan: string | null;      // párrafo descriptivo
}

// ── Comentarios ───────────────────────────────────────────────────────────────
export interface TestimonialItem {
  nombre: string;
  rol: string | null;
  comentario: string;
}

export interface ComentariosData {
  titulo: string;
  descripcion: string;
  comentarios: TestimonialItem[];
}