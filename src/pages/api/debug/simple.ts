import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') as string) || 'en';
  
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/node/content_page?page[limit]=5`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang }
    );
    
    return new Response(JSON.stringify({ 
      lang, 
      status: raw.status,
      hasData: !!raw.data,
      dataType: typeof raw.data,
      keys: raw.data ? Object.keys(raw.data) : [],
      sample: raw.data ? JSON.stringify(raw.data).substring(0, 200) : null
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};