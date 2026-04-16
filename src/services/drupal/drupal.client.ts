/**
 * Cliente HTTP para Drupal JSON:API con caché en memoria.
 *
 * CACHÉ:
 *   - Solo aplica a peticiones GET.
 *   - TTL por defecto: 60 s en producción, 0 (sin caché) en desarrollo.
 *   - Configurable por petición con la opción `cacheTtl` (en milisegundos).
 *   - Máximo 500 entradas (FIFO simple).
 *
 * INTERNACIONALIZACIÓN:
 *   Drupal expone traducciones bajo /en/jsonapi/... para inglés.
 *   Pasar `lang` en RequestOptions agrega el prefijo correcto.
 */

const DRUPAL_BASE_URL      = import.meta.env.DRUPAL_BASE_URL      as string;
const DRUPAL_DEFAULT_LANG  = (import.meta.env.DRUPAL_DEFAULT_LANG as string) ?? 'es';

if (!DRUPAL_BASE_URL) {
  throw new Error('La variable de entorno DRUPAL_BASE_URL no está definida.');
}

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data:      unknown;
  status:    number;
  headers:   Headers;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 500;

/** TTL por defecto en ms. 0 en dev para ver cambios de Drupal inmediatamente. */
const DEFAULT_TTL_MS: number = import.meta.env.PROD ? 60_000 : 0;

function cacheGet<T>(key: string): RawResponse<T> | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return { data: entry.data as T, status: entry.status, headers: entry.headers };
}

function cacheSet(key: string, data: unknown, status: number, headers: Headers, ttlMs: number): void {
  if (ttlMs <= 0) return;
  if (_cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = _cache.keys().next().value;
    if (oldest !== undefined) _cache.delete(oldest);
  }
  _cache.set(key, { data, status, headers, expiresAt: Date.now() + ttlMs });
}

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface RequestOptions {
  method?:       'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?:         unknown;
  formBody?:     Record<string, string>;
  headers?:      Record<string, string>;
  sessionCookie?: string;
  lang?:         string;
  /**
   * TTL en ms para cachear la respuesta (solo GET).
   * undefined → usa DEFAULT_TTL_MS (60 s en prod, 0 en dev).
   * 0         → sin caché.
   * > 0       → TTL explícito.
   */
  cacheTtl?: number;
}

export interface RawResponse<T> {
  data:    T;
  status:  number;
  headers: Headers;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function langPrefix(lang: string | undefined): string {
  if (!lang || lang === DRUPAL_DEFAULT_LANG) return '';
  return `/${lang}`;
}

// ── drupalFetch ───────────────────────────────────────────────────────────────

export async function drupalFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const {
    method         = 'GET',
    body,
    formBody,
    headers:       extraHeaders = {},
    sessionCookie,
    lang,
    cacheTtl,
  } = options;

  const effectiveTtl = cacheTtl ?? DEFAULT_TTL_MS;
  const url          = `${DRUPAL_BASE_URL}${langPrefix(lang)}${path}`;

  // ── Hit de caché ────────────────────────────────────────────────────────────
  if (method === 'GET' && effectiveTtl > 0) {
    const hit = cacheGet<T>(url);
    if (hit) return hit;
  }

  // ── Construir request ───────────────────────────────────────────────────────
  const isForm = formBody !== undefined;
  const headers: Record<string, string> = {
    'Content-Type': isForm ? 'application/x-www-form-urlencoded' : 'application/json',
    Accept:         'application/json',
    ...extraHeaders,
  };
  if (sessionCookie) headers['Cookie'] = sessionCookie;

  let serializedBody: string | undefined;
  if (isForm && formBody) {
    serializedBody = new URLSearchParams(formBody).toString();
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  // ── Fetch ───────────────────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: serializedBody });
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con Drupal en ${url}. ` +
      `Verificá que el servidor esté corriendo. (${networkError})`,
    );
  }

  if (response.status === 404 && lang && lang !== DRUPAL_DEFAULT_LANG) {
    console.warn(
      `[Drupal i18n] 404 en ${url}. ` +
      `Verificá que el método "URL" esté activo en /admin/config/regional/language/detection ` +
      `y que el prefijo "${lang}" esté configurado.`,
    );
  }

  const text = await response.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = text as unknown as T;
  }

  const result: RawResponse<T> = { data, status: response.status, headers: response.headers };

  // ── Guardar en caché (solo GET exitosos) ────────────────────────────────────
  if (method === 'GET' && response.ok && effectiveTtl > 0) {
    cacheSet(url, data, response.status, response.headers, effectiveTtl);
  }

  return result;
}