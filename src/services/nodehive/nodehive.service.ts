/**
 * src/services/nodehive/nodehive.service.ts
 *
 * Servicio legacy de nodos - stub para compatibilidad.
 */

import type { Lang } from '../../i18n/ui';

export interface ServiceNode {
  type: 'node--services';
  id: string;
  title?: string;
  field_description?: string;
  field_image?: unknown;
}

/**
 * Obtiene nodos de tipo services.
 * Esta función estádeprecated - usar getServiciosData de nodehive.blocks.
 */
export async function getServices(limit = 10, _lang?: Lang): Promise<ServiceNode[]> {
  // Stub vacío - los servicios ahora se gestionan como bloques
  return [];
}