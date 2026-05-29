import type { APIRoute } from 'astro';
import { login } from '@/services/nodehive/auth.service';
import { setSession } from '@/services/session.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { username, password } = body as Record<string, string>;

  if (!username?.trim() || !password) {
    return json({ ok: false, error: 'El usuario y la contraseña son requeridos.' }, 400);
  }

  const result = await login({ username: username.trim(), password });

  console.log('[Auth Login] result:', JSON.stringify({ ok: result.ok, statusCode: result.statusCode, error: result.error }));

  if (!result.ok) {
    const status = result.statusCode ?? 401;
    return json({ ok: false, error: result.error }, status);
  }

  await setSession(cookies, result.data);

  const { csrfToken: _c, logoutToken: _l, sessionCookie: _s, accessToken: _a, ...publicUser } = result.data;

  const responseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

  if (result.data.sessionCookie) {
    const cookieMatch = result.data.sessionCookie.match(/^([^=]+=[^;]+)/);
    if (cookieMatch) {
      const encoded = encodeURIComponent(cookieMatch[1]);
      responseHeaders['Set-Cookie'] = `drupal_s=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2000000`;
    }
  }

  return new Response(JSON.stringify({ ok: true, user: publicUser }), {
    status: 200,
    headers: responseHeaders,
  });
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}