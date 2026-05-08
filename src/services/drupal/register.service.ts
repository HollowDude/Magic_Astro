/**
 * src/services/drupal/register.service.ts
 *
 * Servicio de registro de nuevos usuarios contra Drupal JSON:API.
 *
 * Endpoint: POST /jsonapi/user/user
 * Requiere que el permiso "POST" esté habilitado para el recurso user en
 * /admin/config/services/rest o que el módulo JSON:API tenga habilitada
 * la creación de usuarios anónimos en /admin/config/services/jsonapi/resource_types.
 */

import { drupalFetch } from './drupal.client';
import type { ServiceResult } from '@/types/auth';

// ─── Tipos internos del endpoint de Drupal ──────────────────────────────────

interface DrupalUserAttributes {
  drupal_internal__uid: number;
  name: string;
  mail: string;
}

interface DrupalUserResponse {
  data: {
    type: 'user--user';
    id: string;
    attributes: DrupalUserAttributes;
  };
  errors?: Array<{ title?: string; detail?: string }>;
}

// ─── DTO público ─────────────────────────────────────────────────────────────

export interface RegisteredUser {
  uid: string;
  name: string;
  mail: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// ─── Registro ────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo usuario en Drupal vía JSON:API.
 * Devuelve un ServiceResult con los datos del usuario creado o un mensaje de error.
 *
 * Nota: drupal-jsonapi-params aplica solo a peticiones GET con filtros/campos.
 * Para POST de creación de recursos se construye el body JSON:API manualmente,
 * que es el patrón estándar de la especificación.
 */
export async function register(
  credentials: RegisterCredentials,
): Promise<ServiceResult<RegisteredUser>> {
  let raw: Awaited<ReturnType<typeof drupalFetch<DrupalUserResponse>>>;

  try {
    raw = await drupalFetch<DrupalUserResponse>('/jsonapi/user/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept:         'application/vnd.api+json',
      },
      body: {
        data: {
          type: 'user--user',
          attributes: {
            name:  credentials.username,
            mail:  credentials.email,
            pass:  { existing: '', value: credentials.password },
            status: true,
          },
        },
      },
    });
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : 'Error de conexión con Drupal.',
    };
  }

  // JSON:API devuelve 201 Created en éxito
  if (raw.status === 201) {
    const attrs = raw.data.data.attributes;
    return {
      ok:   true,
      data: {
        uid:  String(attrs.drupal_internal__uid),
        name: attrs.name,
        mail: attrs.mail,
      },
    };
  }

  // Intentamos extraer el detalle del error de la respuesta JSON:API
  const firstError = raw.data?.errors?.[0];
  const errorMessage = firstError?.detail ?? firstError?.title ?? mapStatusToMessage(raw.status);

  return { ok: false, error: errorMessage, statusCode: raw.status };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapStatusToMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Datos de registro inválidos.',
    403: 'El registro de usuarios no está habilitado.',
    409: 'El nombre de usuario o el correo ya están en uso.',
    422: 'El nombre de usuario o el correo ya están en uso.',
    500: 'Error interno del servidor Drupal.',
  };
  return messages[status] ?? `Error inesperado al registrar (HTTP ${status}).`;
}