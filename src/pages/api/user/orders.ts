import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { getUserOrders } from '@/services/nodehive/nodehive.user';

export const GET: APIRoute = async ({ cookies, url }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lang = url.searchParams.get('lang') ?? 'es';
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

  const orders = await getUserOrders(session.uid, lang as any, limit);

  return new Response(JSON.stringify(orders), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
