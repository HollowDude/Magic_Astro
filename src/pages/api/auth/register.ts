/**
 * src/pages/api/auth/register.ts
 *
 * POST /api/auth/register
 *
 * Recibe { username, email, password }, llama al servicio de registro de Drupal
 * y, si el sitio permite auto-login tras registro, inicia sesión automáticamente.
 *
 * Respuestas:
 *   201  { ok: true,  user: { uid, name, mail } }
 *   400  { ok: false, error: string }     — validación fallida
 *   409  { ok: false, error: string }     — usuario/email ya existe
 *   500  { ok: false, error: string }     — error interno / Drupal caído
 */

import type { APIRoute } from 'astro';
import { register } from '@/services/drupal/register.service';

// Regex de validación básica de email
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  // ── 1. Parsear body ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { username, email, password } = body as Record<string, string>;

  // ── 2. Validaciones ──────────────────────────────────────────────────────
  if (!username?.trim()) {
    return json({ ok: false, error: 'El nombre de usuario es requerido.' }, 400);
  }
  if (username.trim().length < 3) {
    return json({ ok: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' }, 400);
  }
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return json({ ok: false, error: 'El correo electrónico no es válido.' }, 400);
  }
  if (!password || password.length < 6) {
    return json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
  }

  // ── 3. Registrar en Drupal ───────────────────────────────────────────────
  const result = await register({
    username: username.trim(),
    email:    email.trim(),
    password,
  });

  if (!result.ok) {
    const httpStatus =
      result.statusCode === 409 || result.statusCode === 422 ? 409 : 500;
    return json({ ok: false, error: result.error }, httpStatus);
  }

  return json({ ok: true, user: result.data }, 201);
};

// ─── Helper ─────────────────────────────────────────────────────────────────

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}