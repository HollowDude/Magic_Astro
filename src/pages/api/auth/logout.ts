import type { APIRoute } from 'astro';
import { logout } from '@/services/drupal/auth.service';
import { getSession, destroySession } from '@/services/session.service';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies); // ← await
  destroySession(cookies);

  if (session) {
    const sessionCookie = request.headers.get('cookie') ?? '';
    await logout(session.logoutToken, sessionCookie).catch(() => null);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};