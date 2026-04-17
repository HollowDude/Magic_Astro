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
// ─────────────────────────────────────────────────────────────────────────────

export interface HomepageHeroBlock extends BlockContentBase {
  type: 'block_content--homepage_hero_section';
  field_bienvenida: string;
  field_eslogan: string | null;
  field_descripcion: string;
  field_carrusel_de_fotos: DrupalFile[];
}

export interface HomepagePersonalizationBlock extends BlockContentBase {
  type: 'block_content--homepage_personalization_section';
  field_titulo: string | null;
  field_descripcion_ps: string;
  field_foto: DrupalFile | null;
}

// ── Nodo Servicio referenciado por el bloque ──────────────────────────────────

export interface ServicioNode {
  type: 'node--services';
  id: string;
  title: string;
  field_description: string;
  field_image: DrupalFile | null;
}

export interface HomepageServiciosBlock extends BlockContentBase {
  type: 'block_content--homepage_servicios_section';
  field_titulo_ss: string | null;
  field_sub_titulo_ss: string;
  field_eslogan_ss: string | null;
  /** Servicios referenciados directamente desde el bloque (field_servicios) */
  field_servicios: ServicioNode[];
}

export interface ComentarioNode {
  type: 'node--comentario';
  id: string;
  field_nombre_persona: string;
  field_role_de_la_persona: string | null;
  field_comentario: string;
}

export interface HomepageComentariosBlock extends BlockContentBase {
  type: 'block_content--homepage_comentarios_section';
  field_titulo_cs: string;
  field_descripcion_cs: string;
  field_comentarios: ComentarioNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAS NORMALIZADAS PARA LOS COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

export interface HeroSlide {
  image: string;
  label: string;
}

export interface HeroData {
  title: string;
  slogan: string | null;
  description: string;
  slides: HeroSlide[];
}

export interface PersonalizationData {
  titulo: string | null;
  descripcion: string;
  fotoUrl: string | null;
}

export interface ServicioItem {
  title: string;
  description: string;
  image: string | null;
}

export interface ServiciosData {
  titulo: string | null;
  subTitulo: string;
  eslogan: string | null;
  /** Servicios extraídos de field_servicios del bloque */
  services: ServicioItem[];
}

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