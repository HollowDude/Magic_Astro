/**
 * Tipos de contenido (nodos, bloques, párrafos).
 * Formularios para servicios y datos devueltos por bloques.
 */

import type { NodeHiveMedia } from './base';

// ─────────────────────────────────────────────────────────────────────────────
// Párrafos CMS
// ─────────────────────────────────────────────────────────────────────────────

export interface ButtonParagraph {
  type: 'paragraph--button';
  id: string;
  field_button_text: string;
  field_button_link: {
    uri: string;
    title: string | null;
  };
  field_button_style: 'primary' | 'secondary';
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloques CMS (estructura desserializada por Jsona)
// ─────────────────────────────────────────────────────────────────────────────

export interface HeroCarouselBlock {
  type: 'block_content--hero_carousel';
  id: string;
  field_title?: string;
  field_subtitle?: string;
  field_description?: string;
  field_photosgallery: NodeHiveMedia[];
  field_buttons: ButtonParagraph[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos para devolución de datos desde servicios (normalizados)
// ─────────────────────────────────────────────────────────────────────────────

export interface HeroSlide {
  image: string;
  label: string;
}

/**
 * Datos normalizados devueltos por getHomepageHeroData().
 * Incluye UUID del nodo y del bloque para Visual Editor.
 */
export interface HeroData {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  slides: HeroSlide[];
  ctaButtons: Array<{
    text: string;
    url: string;
    style: 'primary' | 'secondary';
  }>;
  pageId?: string;
  pageInternalId?: number | null;
  parentId?: string | null;
  componentId?: string;
  componentInternalId?: number | null;
}

/**
 * Datos normalizados para sección de personalización.
 */
export interface PersonalizationData {
  titulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
}

/**
 * Servicio normalizado.
 * Devuelto por getServicesBlockData() o servicios similares.
 */
export interface ServiceItem {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
}

/**
 * Datos de servicios desde el bloque.
 */
export interface ServiciosData {
  titulo: string | null;
  subTitulo: string | null;
  eslogan: string | null;
  services: ServiceItem[];
}

/**
 * Item de comentario/testimonial.
 */
export interface TestimonialItem {
  id: string;
  nombre: string;
  rol: string;
  comentario: string;
  calificacion: number;
}

/**
 * Datos de comentarios desde el bloque.
 */
export interface ComentariosData {
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  titulo: string | null;
  descripcion: string | null;
  comentarios: TestimonialItem[];
}

/**
 * Categoría desde el bloque (normalizada).
 */
export interface CategoryData {
  id: string;
  nombre: string;
  slug: string;
  imagen: string | null;
}

/**
 * Datos de categorías desde el bloque.
 */
export interface CategoryBlockData {
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  titulo: string | null;
  subTitulo: string | null;
  categorias: CategoryData[];
}

/**
 * Datos de contacto desde el bloque.
 */
export interface ContactBlockData {
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  titulo: string | null;
  subTitulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

/**
 * Producto destacado (normalizado del bloque).
 */
export interface FeaturedProduct {
  id: string;
  title: string;
  price: string;
  thumbnail: string | null;
  color: string | null;
  tipo: string | null;
  url: string;
}

/**
 * Datos de productos destacados desde el bloque.
 */
export interface FeaturedProductsData {
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  titulo: string | null;
  productos: FeaturedProduct[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shop Page Paragraphs
// ─────────────────────────────────────────────────────────────────────────────

export interface ShopHeaderData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  bundle?: string | null;
  title: string | null;
  description: string | null;
  titleField?: string | null;
  descriptionField?: string | null;
}

export interface ShopBodyData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  bundle?: string | null;
  filters?: string[] | null;
  sorts?: string[] | null;
  itemsPerPage?: number | null;
  filtersField?: string | null;
  sortsField?: string | null;
  itemsPerPageField?: string | null;
}

export interface ShopPageData {
  pageId?: string;
  pageInternalId?: number | null;
  header?: ShopHeaderData | null;
  body?: ShopBodyData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// About Page Paragraphs
// ─────────────────────────────────────────────────────────────────────────────

export interface AboutHeroData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  subtitle: string | null;
  fotoUrl: string | null;
}

export interface AboutStoryData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  fotoUrl: string | null;
}

export interface AboutArchievementItem {
  id: string;
  internalId: number;
  title: string;
  description: string;
  icon: string;
  fotoUrl: string | null;
}

export interface AboutArchievementsData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  items: AboutArchievementItem[];
}

export interface AboutCertificactionData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  subtitle: string | null;
  fotoUrl: string | null;
}

export interface AboutIdentityTag {
  id: string;
  internalId: number;
  label: string;
  color: 'pink' | 'green';
}

export interface AboutIdentityData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  subtitle: string | null;
  tags: AboutIdentityTag[];
}

export interface AboutObjectiveItem {
  id: string;
  internalId: number | null;
  title: string | null;
  description: string | null;
  fotoUrl: string | null;
}

export interface AboutObjectifsData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  title: string | null;
  items: AboutObjectiveItem[];
}

// ─── Auth Page Paragraphs ───────────────────────────────────────────────────

export interface AuthHeroPanelData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  bundle: string;
  title: string | null;
  description: string | null;
  fotoUrl: string | null;
}

export interface AuthFormHeaderData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  bundle: string;
  title: string | null;
  subtitle: string | null;
}

export interface AuthPageData {
  pageId?: string;
  pageInternalId?: number | null;
  heroPanel: AuthHeroPanelData | null;
  formHeader: AuthFormHeaderData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Page Paragraphs
// ─────────────────────────────────────────────────────────────────────────────

export interface PortfolioEventCategory {
  id: string;
  internalId: number | null;
  name: string;
  slug: string;
}

export interface PortfolioEventImage {
  url: string;
  alt: string;
}

export interface PortfolioEventItem {
  id: string;
  internalId: number | null;
  bundle: string;
  title: string;
  subtitle: string | null;
  category: PortfolioEventCategory | null;
  images: PortfolioEventImage[];
}

export interface PortfolioHeaderData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  bundle: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
}

export interface PortfolioGalleryData {
  paragraphId: string | null;
  paragraphInternalId: number | null;
  parentId?: string | number | null;
  parentInternalId?: number | null;
  bundle: string;
  itemsPerLoad: number;
  events: PortfolioEventItem[];
  categories: PortfolioEventCategory[];
}

export interface PortfolioPageData {
  pageId?: string;
  pageInternalId?: number | null;
  header: PortfolioHeaderData | null;
  gallery: PortfolioGalleryData | null;
}

// Courses / Academy Page Paragraphs

export type CourseFormat = 'in-person' | 'digital' | 'workshop';
export type CourseLevel  = 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface CourseItem {
  id:          string;
  internalId:  number | null;
  title:       string;
  description: string | null;
  imageUrl:    string | null;
  price:       string | null;
  isFree:      boolean;
  format:      CourseFormat;
  level:       CourseLevel | null;
  date:        string | null;
  duration:    string | null;
  rating:      number | null;
  reviewCount: number | null;
  spotsLeft:   number | null;
  ctaUrl:      string | null;
  bundle:      string;
}

export interface CoursesHeroSlide {
  image:       string;
  label:       string;
  badgeText:   string | null;
  badgeColor:  string | null;
  title:       string;
  description: string | null;
  ctaUrl:      string | null;
  ctaText:     string | null;
  ctaStyle?:   string | null;
  ctaSecondaryUrl?:   string | null;
  ctaSecondaryText?:  string | null;
  ctaSecondaryStyle?: string | null;
}

export interface CoursesHeroData {
  paragraphId:         string | null;
  paragraphInternalId: number | null;
  parentId?:           string | number | null;
  bundle:              string;
  slides:              CoursesHeroSlide[];
}

export interface CoursesStatsData {
  paragraphId:         string | null;
  paragraphInternalId: number | null;
  parentId?:           string | number | null;
  bundle:              string;
  students:            string | null;
  courses:             string | null;
  rating:              string | null;
  satisfaction:        string | null;
  studentsPrefix?:     string | null;
  studentsSuffix?:     string | null;
  coursesPrefix?:      string | null;
  coursesSuffix?:      string | null;
  ratingPrefix?:       string | null;
  ratingSuffix?:       string | null;
  satisfactionPrefix?: string | null;
  satisfactionSuffix?: string | null;
}

export interface CoursesGridData {
  paragraphId:         string | null;
  paragraphInternalId: number | null;
  parentId?:           string | number | null;
  bundle:              string;
  title:               string | null;
  subtitle:            string | null;
  courses:             CourseItem[];
  itemsPerLoad:        number;
}

export interface CoursesPageData {
  pageId?:             string;
  pageInternalId?:     number | null;
  hero:                CoursesHeroData | null;
  stats:               CoursesStatsData | null;
  grid:                CoursesGridData | null;
}