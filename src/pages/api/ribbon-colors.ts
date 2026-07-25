import type { APIRoute } from 'astro';
import { fetchRibbonColors } from '@/services/nodehive/nodehive.cart';

export const GET: APIRoute = async () => {
  try {
    const colors = await fetchRibbonColors();
    return new Response(JSON.stringify(colors), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch ribbon colors' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};