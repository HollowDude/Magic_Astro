/**
 * Cliente HTTP base para el servidor Drupal.
 * Centraliza la URL base, headers comunes y manejo de errores de red,
 * de modo que los servicios no dependan directamente de fetch ni de env vars.
 */

const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL;

if (!DRUPAL_BASE_URL) {
  throw new Error('La variable de entorno DRUPAL_BASE_URL no está definida.');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Headers extra que se fusionan con los por defecto */
  headers?: Record<string, string>;
  /** Cookie de sesión de Drupal para peticiones autenticadas */
  sessionCookie?: string;
}

export interface RawResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Hace una petición a la API de Drupal.
 * Lanza un error si hay fallo de red.
 * Devuelve el body parseado + status + headers para que el servicio decida.
 */
export async function drupalFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const { method = 'GET', body, headers: extraHeaders = {}, sessionCookie } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const url = `${DRUPAL_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con Drupal en ${DRUPAL_BASE_URL}. ` +
        `Comprueba que el contenedor Docker esté corriendo. (${networkError})`,
    );
  }

  // Drupal puede devolver texto vacío en algunos endpoints
  const text = await response.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = text as unknown as T;
  }

  return { data, status: response.status, headers: response.headers };
}
