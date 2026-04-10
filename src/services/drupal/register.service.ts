/**
 * src/services/drupal/register.service.ts
 *
 * Registro de usuarios via JSON:API de Drupal.
 * Endpoint: POST /jsonapi/user/user
 *
 * ── Requisitos en Drupal ────────────────────────────────────────────────────
 *
 * 1. Habilitar operaciones de escritura en JSON:API:
 *    /admin/config/services/jsonapi
 *    → "Allowed operations" = "All" (no solo Read)
 *
 * 2. Dar permiso al usuario anónimo para crear cuentas:
 *    /admin/config/people/accounts
 *    → "Who can register accounts?" = Visitors
 *      (o "Visitors, but administrator approval is required")
 *
 * 3. Permiso JSON:API para POST en user:
 *    /admin/people/permissions
 *    → Rol "Anonymous user" → "Access POST on User resource"    (si aparece)
 *    Si no aparece ese permiso, el paso 2 es suficiente.
 */

import { drupalFetch } from './drupal.client';
import type { RegisterCredentials, ServiceResult } from '@/types/auth';

// ─── Tipos de respuesta JSON:API ────────────────────────────────────────────

interface JsonApiUserResponse {
  data: {
    type: string;
    id: string; // UUID
    attributes: {
      drupal_internal__uid: number;
      name: string;
      mail: string;
    };
  };
}

interface JsonApiErrorResponse {
  errors?: Array<{ detail?: string; title?: string }>;
}

// ─── CSRF token ─────────────────────────────────────────────────────────────

async function getCsrfToken(): Promise<string> {
  const raw = await drupalFetch<string>('/session/token', { method: 'GET' });
  const token = typeof raw.data === 'string' ? raw.data.trim() : '';
  if (!token) throw new Error('No se pudo obtener el token CSRF de Drupal.');
  return token;
}

// ─── Registro ────────────────────────────────────────────────────────────────

export async function register(
  credentials: RegisterCredentials,
): Promise<ServiceResult<{ uid: string; name: string; mail: string }>> {

  // 1. CSRF token (necesario incluso para peticiones anónimas en Drupal)
  let csrfToken: string;
  try {
    csrfToken = await getCsrfToken();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al obtener token CSRF.',
    };
  }

  // 2. POST al endpoint JSON:API
  let raw: Awaited<ReturnType<typeof drupalFetch<JsonApiUserResponse>>>;
  try {
    raw = await drupalFetch<JsonApiUserResponse>('/jsonapi/user/register', {
      method: 'POST',
      headers: {
        // JSON:API requiere su propio Content-Type
        'Content-Type': 'application/vnd.api+json',
        'Accept':       'application/vnd.api+json',
        'X-CSRF-Token': csrfToken,
      },
      body: {
        data: {
          type: 'user--user',
          attributes: {
            name: credentials.username,
            mail: credentials.email,
            pass: credentials.password,
          },
        },
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error de conexión con Drupal.',
    };
  }

  // 3. Respuesta exitosa: 200 o 201
  if (raw.status === 200 || raw.status === 201) {
    const { attributes, id } = raw.data.data;
    return {
      ok: true,
      data: {
        uid:  String(attributes.drupal_internal__uid),
        name: attributes.name,
        mail: attributes.mail,
      },
    };
  }

  // 4. Extraer mensaje de error de JSON:API (formato diferente a REST)
  const errorBody = raw.data as unknown as JsonApiErrorResponse;
  const firstError = errorBody?.errors?.[0];
  const errorMessage =
    firstError?.detail ?? firstError?.title ?? mapStatusToMessage(raw.status);

  return { ok: false, error: errorMessage, statusCode: raw.status };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function mapStatusToMessage(status: number): string {
  const messages: Record<number, string> = {
    403: 'Registro no permitido. Habilitá escritura en JSON:API y permisos de registro en Drupal.',
    404: 'Endpoint /jsonapi/user/user no encontrado. Verificá que JSON:API esté activo.',
    409: 'El nombre de usuario o correo ya está en uso.',
    422: 'El nombre de usuario o correo ya está en uso.',
    500: 'Error interno del servidor Drupal.',
  };
  return messages[status] ?? `Error inesperado (HTTP ${status}).`;
}