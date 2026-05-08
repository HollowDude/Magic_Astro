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

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.statusCode === 403 ? 403 : 401);
  }

  await setSession(cookies, result.data); // ← await

  const { csrfToken: _c, logoutToken: _l, ...publicUser } = result.data;
  return json({ ok: true, user: publicUser }, 200);
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}