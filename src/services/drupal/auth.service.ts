/**
 * Servicio de autenticación contra Drupal.
 *
 * Drupal expone el endpoint POST /user/login?_format=json
 * del módulo "RESTful Web Services" (restful_web_services) del core.
 * Requiere que el recurso "user" tenga habilitado el método POST
 * en /admin/config/services/rest.
 *
 * En caso de usar Simple OAuth en su lugar, cambia `loginWithCookies`
 * por `loginWithOAuth` y apunta a /oauth/token.
 */

import { drupalFetch } from './drupal.client';
import type {
  LoginCredentials,
  DrupalLoginResponse,
  SessionUser,
  ServiceResult,
} from '@/types/auth';

// ─── Tipos internos del endpoint de Drupal ──────────────────────────────────

interface DrupalErrorResponse {
  message?: string;
}

// ─── Login principal ────────────────────────────────────────────────────────

/**
 * Autentica al usuario mediante cookies de sesión de Drupal (mecanismo nativo).
 * Devuelve un ServiceResult con el usuario de sesión o un mensaje de error.
 */
export async function login(
  credentials: LoginCredentials,
): Promise<ServiceResult<SessionUser>> {
  let raw: Awaited<ReturnType<typeof drupalFetch<DrupalLoginResponse>>>;

  try {
    raw = await drupalFetch<DrupalLoginResponse>('/user/login?_format=json', {
      method: 'POST',
      body: {
        name: credentials.username,
        pass: credentials.password,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error de conexión con Drupal.',
    };
  }

  // Drupal devuelve 200 en login exitoso
  if (raw.status === 200) {
    const drupalUser = raw.data;

    // Propagamos la cookie Set-Cookie de Drupal para que el endpoint de Astro
    // la pueda reenviar al navegador si se desea usar sesión nativa.
    // El consumer puede leer raw.headers.get('Set-Cookie').

    const sessionUser: SessionUser = {
      uid: drupalUser.current_user.uid,
      name: drupalUser.current_user.name,
      roles: drupalUser.current_user.roles,
      csrfToken: drupalUser.csrf_token,
      logoutToken: drupalUser.logout_token,
    };

    return { ok: true, data: sessionUser };
  }

  // Intentamos extraer el mensaje de error de Drupal
  const errorBody = raw.data as unknown as DrupalErrorResponse;
  const errorMessage = errorBody?.message ?? mapStatusToMessage(raw.status);

  return { ok: false, error: errorMessage, statusCode: raw.status };
}

// ─── Logout ─────────────────────────────────────────────────────────────────

/**
 * Cierra sesión en Drupal usando el logout_token del usuario.
 * El logout_token se obtiene al hacer login.
 */
export async function logout(
  logoutToken: string,
  sessionCookie: string,
): Promise<ServiceResult<void>> {
  try {
    const raw = await drupalFetch<void>(
      `/user/logout?_format=json&token=${encodeURIComponent(logoutToken)}`,
      { method: 'POST', sessionCookie },
    );

    if (raw.status === 200 || raw.status === 204) {
      return { ok: true, data: undefined };
    }

    return { ok: false, error: 'No se pudo cerrar sesión en Drupal.', statusCode: raw.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al cerrar sesión.',
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapStatusToMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud es inválida.',
    401: 'Credenciales incorrectas.',
    403: 'No tienes permiso para iniciar sesión.',
    404: 'Endpoint de login no encontrado. Revisa la configuración REST de Drupal.',
    422: 'Usuario o contraseña incorrectos.',
    500: 'Error interno del servidor Drupal.',
  };
  return messages[status] ?? `Error inesperado (HTTP ${status}).`;
}
