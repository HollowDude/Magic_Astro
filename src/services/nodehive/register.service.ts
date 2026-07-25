/**
 * src/services/nodehive/register.service.ts
 *
 * Servicio de registro de usuarios en NodeHive (Drupal).
 */

import { nodehiveFetch } from './nodehive.client';

export interface RegisterData {
  username: string;
  email: string;
  lang?: string;
}

export interface RegisterResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: { uid: number; name: string; mail: string };
}

export async function register(data: RegisterData): Promise<RegisterResult> {
  try {
    const res = await nodehiveFetch<Record<string, unknown>>('/api/user/register-lang?_format=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        name: data.username,
        mail: data.email,
        langcode: data.lang ?? 'en',
      },
    });

    const json = (res.data && typeof res.data === 'object') ? res.data as any : {};

    if (res.status < 200 || res.status >= 300) {
      const detail =
        json?.errors?.[0]?.detail ??
        json?.message ??
        'No se pudo crear la cuenta.';
      return { ok: false, statusCode: res.status, error: detail };
    }

    return {
      ok: true,
      data: {
        uid:  json?.uid?.[0]?.value ?? 0,
        name: json?.name?.[0]?.value ?? data.username,
        mail: json?.mail?.[0]?.value ?? data.email,
      },
    };
  } catch (err) {
    console.error('[Register] Exception:', err);
    return { ok: false, statusCode: 503, error: 'No se pudo conectar con el servidor.' };
  }
}
