/**
 * src/pages/api/auth/set-password.ts
 *
 * POST /api/auth/set-password
 *
 * Recibe { uid, timestamp, hash, password } del one-time login link,
 * activa la cuenta, establece la contraseña y crea la sesión.
 */

import type { APIRoute } from 'astro';
import { setPasswordFromOneTimeLogin } from '@/services/nodehive/setPassword.service';
import { setSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));
  const { uid, timestamp, hash, password } = body as Record<string, string>;

  if (!uid || !timestamp || !hash || !password) {
    return json({ ok: false, error: 'Parámetros incompletos.' }, 400);
  }
  if (password.length < 8) {
    return json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  }

  const result = await setPasswordFromOneTimeLogin({ uid, timestamp, hash, newPassword: password });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.statusCode ?? 400);
  }

  // Auto-login: guardar sesión si hay datos de sesión
  if (result.data) {
    await setSession(cookies, result.data);
    return json({ ok: true, user: { name: result.data.name } }, 200);
  }

  // Contraseña establecida pero auto-login falló — redirigir a login manual
  return json({ ok: true, user: null, requiresLogin: true }, 200);
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
