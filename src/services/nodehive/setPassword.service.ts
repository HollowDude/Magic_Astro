/**
 * src/services/nodehive/setPassword.service.ts
 *
 * Servicio para activar cuenta via one-time login link y establecer contraseña.
 *
 * Usa el endpoint custom de NodeHive:
 * POST /api/nodehive/reset-password
 * Body: { uid, timestamp, hash, password }
 *
 * Después hace auto-login para obtener tokens de sesión.
 */

import { nodehiveFetch } from './nodehive.client';
import type { SessionUser } from '@/types/auth';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

export interface SetPasswordData {
  uid: string;
  timestamp: string;
  hash: string;
  newPassword: string;
}

export interface SetPasswordResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: SessionUser;
}

export async function setPasswordFromOneTimeLogin(
  data: SetPasswordData,
): Promise<SetPasswordResult> {
  try {
    const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');

    // PASO 1: POST al endpoint custom de NodeHive para resetear password
    console.log('[SetPassword] Step 1: POST to /api/nodehive/reset-password');

    const resetRes = await nodehiveFetch<Record<string, unknown>>(
      '/api/nodehive/reset-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          uid: data.uid,
          timestamp: data.timestamp,
          hash: data.hash,
          password: data.newPassword,
        },
        skipApiKey: true,
      },
    );

    console.log('[SetPassword] Reset status:', resetRes.status);

    if (resetRes.status !== 200) {
      const resetData = resetRes.data as any;
      const msg = resetData?.error ?? 'No se pudo establecer la contraseña.';
      console.error('[SetPassword] Reset failed:', JSON.stringify(resetData));
      return { ok: false, statusCode: resetRes.status, error: msg };
    }

    console.log('[SetPassword] Password set successfully');

    // PASO 2: Obtener info del usuario via JSON:API
    const userRes = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/user/user?filter[drupal_internal__uid]=${data.uid}&page[limit]=1`,
      {
        method: 'GET',
        headers: { Accept: 'application/vnd.api+json' },
        skipApiKey: true,
      },
    );

    let userName = '';
    let userMail = '';

    if (userRes.status === 200) {
      const userData = userRes.data as any;
      const userItem = userData?.data?.[0];
      if (userItem) {
        userName = userItem.attributes?.name ?? '';
        userMail = userItem.attributes?.mail ?? '';
      }
    }

    // PASO 3: Auto-login para obtener tokens de sesión
    console.log('[SetPassword] Step 2: Auto-login');
    const sessionResult = await doLoginAfterPasswordSet(userName, data.newPassword);

    if (sessionResult) {
      sessionResult.mail = userMail;
    }

    return {
      ok: true,
      data: sessionResult,
    };
  } catch (err) {
    console.error('[SetPassword] Exception:', err);
    return { ok: false, statusCode: 503, error: 'No se pudo conectar con el servidor.' };
  }
}

async function doLoginAfterPasswordSet(
  username: string,
  password: string,
): Promise<SessionUser | undefined> {
  try {
    const loginRes = await nodehiveFetch<Record<string, unknown>>(
      '/user/login?_format=json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          name: username,
          pass: password,
        },
        skipApiKey: true,
      },
    );

    if (loginRes.status === 200) {
      const json = loginRes.data as any;
      if (json.current_user) {
        return {
          uid: String(json.current_user.uid ?? ''),
          name: json.current_user.name ?? '',
          mail: json.current_user.mail ?? '',
          roles: json.current_user.roles ?? [],
          csrfToken: json.csrf_token ?? '',
          logoutToken: json.logout_token ?? '',
        };
      }
    }
    console.warn('[SetPassword] Auto-login response:', loginRes.status, JSON.stringify(loginRes.data));
  } catch (err) {
    console.warn('[SetPassword] Auto-login failed:', err);
  }
  return undefined;
}
