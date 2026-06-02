/**
 * src/pages/api/auth/forgot-password.ts
 *
 * POST /api/auth/forgot-password
 *
 * Recibe { email: string, lang?: string }, llama al endpoint de Drupal
 * que envía el correo en el idioma especificado.
 *
 * Drupal siempre devuelve 200 (incluso si el email no existe) por seguridad,
 * así que siempre respondemos { ok: true } salvo error de servidor.
 */

import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { email, lang } = body as Record<string, string>;
  const langcode = (lang === 'es' || lang === 'en') ? lang : '';

  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return json({ ok: false, error: 'El correo electrónico no es válido.' }, 400);
  }

  try {
    const res = await nodehiveFetch<Record<string, unknown>>('/api/user/password-lang?_format=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: { mail: email.trim(), langcode },
      skipApiKey: true,
    });

    // Drupal devuelve 200/204 incluso si el email no existe (por seguridad)
    if (res.status === 200 || res.status === 204) {
      return json({ ok: true }, 200);
    }

    const data = res.data as any;
    const msg = data?.message ?? 'No se pudo enviar el correo de recuperación.';
    return json({ ok: false, error: msg }, res.status ?? 500);
  } catch {
    return json({ ok: false, error: 'No se pudo conectar con el servidor.' }, 503);
  }
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
