import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const GET: APIRoute = async ({ url }) => {
  const uid = url.searchParams.get('uid')?.trim();
  const timestamp = url.searchParams.get('timestamp')?.trim();
  const hash = url.searchParams.get('hash')?.trim();

  if (!uid || !timestamp || !hash) {
    return new Response(
      JSON.stringify({ valid: false, error: 'Missing required parameters: uid, timestamp, hash' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const res = await nodehiveFetch<any>(
      `/api/nodehive/validate-reset-link?uid=${encodeURIComponent(uid)}&timestamp=${encodeURIComponent(timestamp)}&hash=${encodeURIComponent(hash)}`,
      {
        headers: { Accept: 'application/json' },
        cacheTtl: 0,
      },
    );

    const data = res.data ?? {};

    if (res.status === 200 && data.valid === true) {
      return new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ valid: false, error: data.error ?? 'Invalid or expired link' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ valid: false, error: 'Could not connect to server.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
