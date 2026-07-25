import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      uid: session.uid,
      name: session.name,
      mail: session.mail,
      roles: session.roles,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
