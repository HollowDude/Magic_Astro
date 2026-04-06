/**
 * POST /api/auth/login
 *
 * Recibe { username, password }, llama al servicio de autenticación de Drupal
 * y, en caso de éxito, guarda la sesión en cookie HTTP-only.
 *
 * Respuestas:
 *   200  { ok: true,  user: SessionUser }
 *   400  { ok: false, error: string }     — validación fallida
 *   401  { ok: false, error: string }     — credenciales incorrectas
 *   500  { ok: false, error: string }     — error interno / Drupal caído
 */

import type { APIRoute } from 'astro';
import { login } from '@/services/drupal/auth.service';
import { setSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  // ── 1. Parsear body ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { username, password } = body as Record<string, string>;

  // ── 2. Validación básica ───────────────────────────────────────────────────
  if (!username?.trim() || !password) {
    return json({ ok: false, error: 'El usuario y la contraseña son requeridos.' }, 400);
  }

  // ── 3. Autenticar contra Drupal ────────────────────────────────────────────
  const result = await login({ username: username.trim(), password });

  if (!result.ok) {
    const httpStatus = result.statusCode === 403 ? 403 : 401;
    return json({ ok: false, error: result.error }, httpStatus);
  }

  // ── 4. Persistir sesión en cookie HTTP-only ────────────────────────────────
  setSession(cookies, result.data);

  // No exponemos el token CSRF en la respuesta pública;
  // el frontend solo necesita saber que el login fue exitoso.
  const { csrfToken: _omit, logoutToken: _omit2, ...publicUser } = result.data;

  return json({ ok: true, user: publicUser }, 200);
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
