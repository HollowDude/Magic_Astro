import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const GET: APIRoute = async ({ url }) => {
  const mail = url.searchParams.get('mail')?.trim();

  if (!mail) {
    return new Response(JSON.stringify({ exists: false, error: 'Missing mail parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await nodehiveFetch<any>(
      `/api/nodehive/check-email?mail=${encodeURIComponent(mail)}`,
      {
        headers: { Accept: 'application/json' },
        cacheTtl: 0,
      },
    );

    if (res.status === 200 && res.data?.exists === true) {
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
