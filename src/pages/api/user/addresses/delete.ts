import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  if (!session.accessToken) {
    return new Response(JSON.stringify({ ok: false, error: 'Session token expired, please log in again' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Profile id is required' }), { status: 400 });
  }

  try {
    const lang = body.lang || 'es';
    const res = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/profile/customer/${id}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/vnd.api+json' },
        lang,
        bearerToken: session.accessToken,
      },
    );

    if (res.status === 204) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const errors = (res.data as any)?.errors;
    const detail = errors?.[0]?.detail ?? `Drupal returned HTTP ${res.status}`;
    return new Response(JSON.stringify({ ok: false, error: detail }), { status: 422 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
