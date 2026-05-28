import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { name, email, message } = body as Record<string, string>;

  if (!name?.trim()) {
    return json({ ok: false, field: 'name', error: 'El nombre es requerido.' }, 400);
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, field: 'email', error: 'Correo electrónico no válido.' }, 400);
  }
  if (!message?.trim()) {
    return json({ ok: false, field: 'message', error: 'El mensaje es requerido.' }, 400);
  }
  if (message.length > 500) {
    return json({ ok: false, field: 'message', error: 'El mensaje no puede superar los 500 caracteres.' }, 400);
  }

  try {
    const cookie = request.headers.get('cookie') ?? '';
    const match = cookie.match(/drupal_s=([^;]+)/);
    const drupalSession = match ? decodeURIComponent(match[1]) : undefined;

    const basicUser = import.meta.env.NODEHIVE_BASIC_AUTH_USER as string | undefined;
    const basicPass = import.meta.env.NODEHIVE_BASIC_AUTH_PASS as string | undefined;
    const hasBasic = !!(basicUser && basicPass);
    const authHeaders: Record<string, string> = hasBasic
      ? { Authorization: `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString('base64')}` }
      : {};

    const res = await nodehiveFetch<Record<string, any>>('/webform_rest/submit', {
      method: 'POST',
      body: {
        webform_id: 'contacto_frontend',
        name,
        mail: email,
        message,
      },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders },
      sessionCookie: drupalSession,
      skipApiKey: hasBasic || !!drupalSession,
      cacheTtl: 0,
    });

    if (res.status === 200 || res.status === 201) {
      return json({ ok: true }, 200);
    }

    const data = res.data as any;
    let errorMessage = 'No se pudo enviar el mensaje. Intenta de nuevo.';
    if (typeof data === 'string') {
      errorMessage = data;
    } else if (data) {
      errorMessage =
        data?.message
        ?? data?.error
        ?? data?.errors?.[0]?.detail
        ?? errorMessage;
    }

    return json({ ok: false, error: errorMessage }, res.status || 500);
  } catch (err) {
    console.error('[Contact] Error al enviar webform:', err);
    return json({ ok: false, error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }, 500);
  }
};
