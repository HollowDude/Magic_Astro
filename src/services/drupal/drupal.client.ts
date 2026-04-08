/**
 * Cliente HTTP base para el servidor Drupal.
 *
 * CAMBIO respecto a la versión anterior:
 *   Ahora soporta formBody (application/x-www-form-urlencoded) además de JSON,
 *   necesario para los endpoints OAuth2 (/oauth/token, /oauth/revoke).
 *
 *   OAuth2 RFC 6749 exige form-urlencoded en el token endpoint.
 *   Si mandás JSON, Drupal Simple OAuth responde 400 directamente.
 */

const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL as string;

if (!DRUPAL_BASE_URL) {
  throw new Error('La variable de entorno DRUPAL_BASE_URL no está definida.');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Body como JSON (se serializa con JSON.stringify) */
  body?: unknown;
  /** Body como form-urlencoded (para /oauth/token, /oauth/revoke) */
  formBody?: Record<string, string>;
  /** Headers extra fusionados con los por defecto */
  headers?: Record<string, string>;
}

export interface RawResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Hace una petición a la API de Drupal.
 * - Si se pasa `formBody`, el Content-Type es application/x-www-form-urlencoded.
 * - Si se pasa `body`, el Content-Type es application/json.
 * - Los headers extra (incluido Authorization: Bearer) se fusionan encima.
 *
 * Lanza un Error si hay fallo de red (fetch rechazado).
 * Devuelve status + data parseado para que el servicio decida qué hacer.
 */
export async function drupalFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const { method = 'GET', body, formBody, headers: extraHeaders = {} } = options;

  // Determinamos Content-Type según el tipo de body
  const isForm = formBody !== undefined;
  const contentType = isForm ? 'application/x-www-form-urlencoded' : 'application/json';

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    Accept:         'application/json',
    ...extraHeaders, // aquí pueden llegar Authorization: Bearer, Cookie, etc.
  };

  // Serialización del body
  let serializedBody: string | undefined;
  if (isForm && formBody) {
    // URLSearchParams serializa automáticamente a key=value&key2=value2
    serializedBody = new URLSearchParams(formBody).toString();
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  const url = `${DRUPAL_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
    });
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
    // Algunos endpoints devuelven texto plano (ej: /oauth/revoke devuelve vacío en éxito)
    data = text as unknown as T;
  }

  return { data, status: response.status, headers: response.headers };
}