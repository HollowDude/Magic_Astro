/**
 * Servicio de sesión del lado del servidor (Astro SSR).
 * Almacena el usuario autenticado en una cookie HTTP-only firmada con base64.
 *
 * ⚠️  En producción considera usar una biblioteca de sesiones como iron-session
 *     o jose (JWT) para cifrar el payload de la cookie.
 */

import type { AstroCookies } from 'astro';
import type { SessionUser } from '@/types/auth';

const COOKIE_NAME = 'mf_session';
const SESSION_MAX_AGE = Number(import.meta.env.SESSION_MAX_AGE ?? 86400);

// ─── Guardar sesión ──────────────────────────────────────────────────────────

export function setSession(cookies: AstroCookies, user: SessionUser): void {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');

  cookies.set(COOKIE_NAME, payload, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

// ─── Leer sesión ─────────────────────────────────────────────────────────────

export function getSession(cookies: AstroCookies): SessionUser | null {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const json = Buffer.from(raw, 'base64').toString('utf-8');
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

// ─── Destruir sesión ──────────────────────────────────────────────────────────

export function destroySession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
