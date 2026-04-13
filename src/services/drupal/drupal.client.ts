/**
 * src/services/drupal/drupal.client.ts
 *
 * INTERNACIONALIZACIÓN — cómo funciona:
 *
 * Drupal JSON:API expone traducciones en rutas prefijadas por idioma:
 *   Español (default): /jsonapi/...        (sin prefijo)
 *   Inglés:            /en/jsonapi/...
 *
 * Pasar `lang` en RequestOptions agrega automáticamente el prefijo correcto.
 *
 * REQUISITOS EN DRUPAL:
 *   1. /admin/config/regional/language/detection
 *      → Activar "URL" como método de detección (probablemente ya activo)
 *      → Configurar prefijo: es="" (vacío o "es"), en="en"
 *   2. Content Translation activo + traducción habilitada por entity type
 *   3. Traducciones creadas en el contenido
 *
 * ALTERNATIVA — Accept-Language (más frágil, requiere config extra):
 *   Si preferís este método: activar "Browser" en language/detection
 *   y cambiar a usar el header en vez del prefijo de URL.
 */

const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL as string;

/** Idioma por defecto del sitio Drupal (sin prefijo en la URL) */
const DRUPAL_DEFAULT_LANG = (import.meta.env.DRUPAL_DEFAULT_LANG as string) ?? 'es';

if (!DRUPAL_BASE_URL) {
  throw new Error('La variable de entorno DRUPAL_BASE_URL no está definida.');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  formBody?: Record<string, string>;
  headers?: Record<string, string>;
  sessionCookie?: string;
  /**
   * Idioma de la respuesta ('es' | 'en').
   * - Si es el idioma por defecto de Drupal → sin prefijo (/jsonapi/...)
   * - Si es otro idioma → agrega prefijo (/en/jsonapi/...)
   * - undefined → sin prefijo (idioma por defecto del sitio)
   */
  lang?: string;
}

export interface RawResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Construye el prefijo de idioma para la URL.
 * Si el idioma es el default de Drupal, no agrega prefijo.
 */
function langPrefix(lang: string | undefined): string {
  if (!lang) return '';
  return `/${lang}`;
}

export async function drupalFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const {
    method = 'GET',
    body,
    formBody,
    headers: extraHeaders = {},
    sessionCookie,
    lang,
  } = options;

  const isForm = formBody !== undefined;
  const defaultContentType = isForm
    ? 'application/x-www-form-urlencoded'
    : 'application/json';

  const headers: Record<string, string> = {
    'Content-Type': defaultContentType,
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  let serializedBody: string | undefined;
  if (isForm && formBody) {
    serializedBody = new URLSearchParams(formBody).toString();
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  // URL con prefijo de idioma: /en/jsonapi/... o /jsonapi/...
  const url = `${DRUPAL_BASE_URL}${langPrefix(lang)}${path}`;
  // debug temporal — borrar después
  console.log(`[drupalFetch] url=${url}  lang=${lang ?? 'none'}`);
  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: serializedBody });
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con Drupal en ${url}. ` +
      `Verificá que el servidor esté corriendo. (${networkError})`,
    );
  }

  // Si Drupal devuelve 404 en la ruta con prefijo, puede ser que la
  // detección de idioma por URL no esté activa. Loguear para diagnóstico.
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

  return { data, status: response.status, headers: response.headers };
}