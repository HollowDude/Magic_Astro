// src/services/nodehive/nodehive.nodes.ts

import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';
import { nodehiveFetch } from './nodehive.client';
import type { NodeHiveFile } from '@/types/nodehive.commerce';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

// ── Tipo del nodo Services ─────────────────────────────────────────────────────

export interface ServiceNode {
  type: 'node--services';
  id: string;
  title: string;
  body?: {
    value: string;
    format: string;
    processed: string;
  };
  field_head_photo?: {
    type: 'media--image';
    id: string;
    name: string;
    field_media_image?: NodeHiveFile;
  } | null;
}

/** Forma normalizada para el componente */
export interface ServiceItem {
  title: string;
  description: string;
  image: string | null;
}

// ── Tipo del nodo Comment ──────────────────────────────────────────────────────

export interface CommentNode {
  type: 'node--comment';
  id: string;
  body?: {
    value: string;
    format: string;
    processed: string;
  };
  field_person_name: string;
  field_person_rol?: string;
}

/** Forma normalizada para el componente */
export interface CommentItem {
  nombre: string;
  rol: string | null;
  comentario: string;
}

// ── Config de content types ────────────────────────────────────────────────────

interface ContentTypeConfig {
  nodeType: string;
  includes: string[];
  nodeFields: string[];
  relatedFields?: Record<string, string[]>;
}

const CONTENT_TYPE_CONFIGS = {
  services: {
    nodeType:    'services',
    includes:    ['field_head_photo', 'field_head_photo.field_media_image'],
    nodeFields:  ['title', 'body', 'field_head_photo'],
    relatedFields: {
      'media--image': ['name', 'field_media_image'],
      'file--file':   ['filename', 'uri', 'filemime'],
    },
  },
  comment: {
    nodeType:    'comment',
    includes:    [],
    nodeFields:  ['body', 'field_person_name', 'field_person_rol'],
    relatedFields: {},
  },
} satisfies Record<string, ContentTypeConfig>;

export type ContentTypeKey = keyof typeof CONTENT_TYPE_CONFIGS;

// ── Fetch genérico ─────────────────────────────────────────────────────────────

async function getNodes<T>(
  contentTypeKey: ContentTypeKey,
  limit = 10,
  lang?: Lang,
): Promise<T[]> {
  const config = CONTENT_TYPE_CONFIGS[contentTypeKey];

  const apiParams = new DrupalJsonApiParams();

  apiParams
    .addFilter('status', '1')
    .addPageLimit(limit)
    .addInclude(config.includes)
    .addFields(`node--${config.nodeType}`, config.nodeFields);

  if (config.relatedFields) {
    for (const [entityType, fields] of Object.entries(config.relatedFields)) {
      apiParams.addFields(entityType, fields);
    }
  }

  const path = `/jsonapi/node/${config.nodeType}?${apiParams.getQueryString()}`;

  let raw: Awaited<ReturnType<typeof nodehiveFetch<Record<string, unknown>>>>;

  try {
    raw = await nodehiveFetch<Record<string, unknown>>(path, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
      lang,
    });
  } catch (err) {
    console.error(`[Nodes] Error de red (${contentTypeKey}, lang: ${lang ?? 'default'}):`, err);
    return [];
  }

  if (raw.status !== 200) {
    console.error(`[Nodes] HTTP ${raw.status} en ${path} (lang: ${lang ?? 'default'})`);
    return [];
  }

  try {
    const result = dataFormatter.deserialize(raw.data);
    return (Array.isArray(result) ? result : [result]) as T[];
  } catch (err) {
    console.error(`[Nodes] Error al deserializar (${contentTypeKey}):`, err);
    return [];
  }
}

// ── Exports públicos ───────────────────────────────────────────────────────────

/**
 * Obtiene los nodos de tipo "services" publicados desde NodeHive JSON:API.
 */
export function getServices(limit = 10, lang?: Lang): Promise<ServiceNode[]> {
  return getNodes<ServiceNode>('services', limit, lang);
}

/**
 * Obtiene los nodos de tipo "comment" publicados desde NodeHive JSON:API.
 */
export function getComments(limit = 10, lang?: Lang): Promise<CommentNode[]> {
  return getNodes<CommentNode>('comment', limit, lang);
}