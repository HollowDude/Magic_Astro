import type { APIRoute } from 'astro';
import { getHelpPageData } from '@/services/nodehive/nodehive.help';

export const GET: APIRoute = async ({ params, request }) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'faq';
  const lang = (searchParams.get('lang') as any) || 'es';
  
  const data = await getHelpPageData(slug, lang);
  
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};