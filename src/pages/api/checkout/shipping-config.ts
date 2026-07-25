import type { APIRoute } from 'astro';
import { getShippingConfig } from '@/services/nodehive/nodehive.shipping';

export const GET: APIRoute = async ({ url }) => {
  const lang = url.searchParams.get('lang') ?? 'es';
  const config = await getShippingConfig(lang);
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
