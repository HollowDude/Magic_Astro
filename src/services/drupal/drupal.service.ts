// src/services/drupal/drupal.services.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { drupalFetch } from './drupal.client';
import type { DrupalFile } from '@/types/commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

// ── Tipo del nodo Servicio ────────────────────────────────────────────────────

export interface DrupalService {
  type: 'node--services';
  id: string;
  title: string;
  field_description: string;
  field_image: DrupalFile | null;
}

// ── Forma normalizada para el componente (desacoplada de Drupal) ──────────────

export interface ServiceItem {
  title: string;
  description: string;
  /** URL absoluta de la imagen, o null si no hay */
  image: string | null;
}

// ── Config del content type ───────────────────────────────────────────────────

const SERVICES_CONFIG = {
  nodeType:    'services',
  includes:    ['field_image'],
  nodeFields:  ['title', 'field_description', 'field_image'],
  relatedFields: {
    'file--file': ['filename', 'uri', 'filemime'],
  },
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene los nodos de tipo "services" publicados desde Drupal JSON:API.
 *
 * @param limit  Máximo de nodos a traer (default: 10)
 * @param lang   Idioma deseado ('es' | 'en'). Si no se pasa, usa el default de Drupal.
 */
export async function getServices(limit = 10, lang?: Lang): Promise<DrupalService[]> {
  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addPageLimit(limit)
    .addInclude(SERVICES_CONFIG.includes)
    .addFields(`node--${SERVICES_CONFIG.nodeType}`, SERVICES_CONFIG.nodeFields);

  for (const [entityType, fields] of Object.entries(SERVICES_CONFIG.relatedFields)) {
    apiParams.addFields(entityType, fields);
  }

  const path = `/jsonapi/node/${SERVICES_CONFIG.nodeType}?${apiParams.getQueryString()}`;

  let raw: Awaited<ReturnType<typeof drupalFetch<Record<string, unknown>>>>;

  try {
    raw = await drupalFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error(`[Services] Error de red (lang: ${lang ?? 'default'}):`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Services] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`);
    return [];
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result : [result]) as DrupalService[];
  } catch (err) {
    console.error('[Services] Error al deserializar:', err);
    return [];
  }
}