/**
 * src/services/drupal/drupal.client.ts
 *
 * Cliente HTTP base para el servidor Drupal.
 * Soporta JSON, form-urlencoded y JSON:API (application/vnd.api+json).
 *
 * INTERNACIONALIZACIÓN:
 *   Pasa `lang` en RequestOptions para que Drupal devuelva el contenido
 *   en el idioma solicitado via Accept-Language.
 *   Requiere: módulos Language + Content Translation + traducciones creadas.
 */

const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL as string;

if (!DRUPAL_BASE_URL) {
  throw new Error('La variable de entorno DRUPAL_BASE_URL no está definida.');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Body como JSON (application/json) */
  body?: unknown;
  /** Body como form-urlencoded (para /oauth/token, etc.) */
  formBody?: Record<string, string>;
  /** Headers extra — pueden sobreescribir Content-Type, Accept y Accept-Language */
  headers?: Record<string, string>;
  /** Cookie de sesión de Drupal para reenviar en logout */
  sessionCookie?: string;
  /**
   * Idioma de la respuesta deseada (ej: 'es' | 'en').
   * Agrega automáticamente Accept-Language al request.
   * Drupal respeta este header cuando Content Translation está habilitado
   * y el entity type tiene traducción activa.
   * Si no se provee, Drupal devuelve el idioma por defecto del sitio.
   */
  lang?: string;
}

export interface RawResponse<T> {
  data: T;
  status: number;
  headers: Headers;
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

  // extraHeaders puede sobreescribir Content-Type (útil para JSON:API)
  const headers: Record<string, string> = {
    'Content-Type': defaultContentType,
    Accept: 'application/json',
    ...extraHeaders,
  };

  // Accept-Language: Drupal usa este header para devolver la traducción correcta.
  // Se puede sobreescribir via extraHeaders si se necesita un valor custom.
  if (lang && !headers['Accept-Language']) {
    // Ejemplo: 'es' → 'es, *;q=0.5' (fallback al idioma por defecto si no hay traducción)
    headers['Accept-Language'] = `${lang}, *;q=0.5`;
  }

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  let serializedBody: string | undefined;
  if (isForm && formBody) {
    serializedBody = new URLSearchParams(formBody).toString();
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  const url = `${DRUPAL_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: serializedBody });
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con Drupal en ${DRUPAL_BASE_URL}. ` +
      `Verificá que el servidor esté corriendo. (${networkError})`,
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