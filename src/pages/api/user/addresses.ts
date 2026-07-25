import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { getUserAddresses } from '@/services/nodehive/nodehive.user';

export const GET: APIRoute = async ({ cookies, url }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lang = url.searchParams.get('lang') ?? 'es';

  const addresses = await getUserAddresses(session.uid, lang as any, session.accessToken);

  return new Response(JSON.stringify(addresses), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
