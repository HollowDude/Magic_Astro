import type { APIRoute } from 'astro';
import { logout } from '@/services/nodehive/auth.service';
import { getSession, destroySession } from '@/services/session.service';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  destroySession(cookies);

  if (session) {
    const sessionCookie = request.headers.get('cookie') ?? '';
    await logout(session.logoutToken, sessionCookie).catch(() => null);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  headers['Set-Cookie'] = 'drupal_s=; Path=/api/cart; HttpOnly; SameSite=Lax; Max-Age=0';

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
};