/**
 * Tipos para componentes que consumen servicios.
 * Pequeños DTOs normalizados, separados del modelo CMS.
 */

/**
 * Item de servicio normalizado para componentes.
 * (Podría ser alias de ServiceItem si son idénticos)
 */
export interface ServiceItemComponent {
  title: string;
  description: string;
  image: string | null;
}

/**
 * Item de comentario/testimonial normalizado para componentes.
 */
export interface CommentItem {
  nombre: string;
  rol: string | null;
  comentario: string;
  calificacion?: number;
}