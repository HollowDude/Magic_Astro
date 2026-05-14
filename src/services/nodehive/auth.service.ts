/**
 * src/services/nodehive/auth.service.ts
 *
 * Servicio de autenticación de usuarios en NodeHive (Drupal).
 */

import { nodehiveFetch } from './nodehive.client';

export interface LoginData {
  username: string;
  password: string;
}

export interface SessionUser {
  uid: string;
  name: string;
  mail: string;
  roles: string[];
  csrfToken: string;
  logoutToken: string;
}

export interface LoginResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: SessionUser;
}

export async function login(data: LoginData): Promise<LoginResult> {
  try {
    const res = await nodehiveFetch<Record<string, unknown>>('/user/login?_format=json', {
      method: 'POST',
      body: {
        name: data.username,
        pass: data.password,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const json = (res.data && typeof res.data === 'object') ? res.data as any : {};

    if (res.status < 200 || res.status >= 300) {
      const msg = json?.message ?? 'Credenciales incorrectas.';
      return { ok: false, statusCode: res.status, error: msg };
    }

    return {
      ok: true,
      data: {
        uid:         String(json.current_user?.uid ?? ''),
        name:        json.current_user?.name ?? data.username,
        mail:        json.current_user?.mail ?? '',
        roles:       json.current_user?.roles ?? [],
        csrfToken:   json.csrf_token   ?? '',
        logoutToken: json.logout_token ?? '',
      },
    };
  } catch (err) {
    return { ok: false, statusCode: 503, error: 'No se pudo conectar con el servidor.' };
  }
}

export async function logout(
  logoutToken: string,
  sessionCookie?: string,
): Promise<{ ok: boolean }> {
  try {
    await nodehiveFetch(`/user/logout?_format=json&token=${logoutToken}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      sessionCookie,
    });
  } catch {}
  return { ok: true };
}
