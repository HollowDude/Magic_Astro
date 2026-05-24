/**
 * src/services/nodehive/auth.service.ts
 *
 * Servicio de autenticación de usuarios en NodeHive (Drupal).
 */

import { nodehiveFetch } from './nodehive.client';

const NODEHIVE_BASE_URL = (import.meta.env.NODEHIVE_BASE_URL as string)?.replace(/\/+$/, '') ?? '';

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
      skipApiKey: true,
      timeoutMs: 10000,
    });

    const json = (res.data && typeof res.data === 'object') ? res.data as any : {};

    if (res.status < 200 || res.status >= 300) {
      const msg = json?.message ?? 'Credenciales incorrectas.';
      return { ok: false, statusCode: res.status, error: msg };
    }

    // Fetch user mail via Bearer token (login response incluye access_token)
    let mail = '';
    const accessToken: string = json.access_token ?? '';
    const uid = String(json.current_user?.uid ?? '');
    if (accessToken && uid) {
      try {
        const mailRes = await fetch(`${NODEHIVE_BASE_URL}/user/${uid}?_format=json`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });
        if (mailRes.ok) {
          const userData = await mailRes.json() as any;
          mail = userData?.mail?.[0]?.value ?? '';
        }
      } catch {
        // fallback: mail stays empty
      }
    }

    return {
      ok: true,
      data: {
        uid,
        name:        json.current_user?.name ?? data.username,
        mail,
        roles:       json.current_user?.roles ?? [],
        csrfToken:   json.csrf_token   ?? '',
        logoutToken: json.logout_token ?? '',
        accessToken,
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
