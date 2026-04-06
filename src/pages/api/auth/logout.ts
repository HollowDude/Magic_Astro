/**
 * POST /api/auth/logout
 *
 * Destruye la sesión local y notifica a Drupal para invalidar la sesión remota.
 */

import type { APIRoute } from 'astro';
import { logout } from '@/services/drupal/auth.service';
import { getSession, destroySession } from '@/services/session.service';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = getSession(cookies);

  // Destruimos la cookie local siempre, haya o no sesión
  destroySession(cookies);

  if (session) {
    const sessionCookie = request.headers.get('cookie') ?? '';
    // Fire-and-forget: si Drupal falla, la sesión local ya está destruida
    await logout(session.logoutToken, sessionCookie).catch(() => null);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
