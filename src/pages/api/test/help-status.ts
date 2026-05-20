import type { APIRoute } from 'astro';
import { getHelpPageData } from '@/services/nodehive/nodehive.help';

export const GET: APIRoute = async () => {
  // Test all the help pages
  const testCases = [
    { slug: 'faq', lang: 'es' },
    { slug: 'faq', lang: 'en' },
    { slug: 'envios', lang: 'es' },
    { slug: 'shipping', lang: 'en' },
    { slug: 'devoluciones', lang: 'es' },
    { slug: 'returns', lang: 'en' },
    { slug: 'terminos', lang: 'es' },
    { slug: 'terms', lang: 'en' },
    { slug: 'privacidad', lang: 'es' },
    { slug: 'privacy', lang: 'en' },
  ];

  const results = await Promise.all(
    testCases.map(({ slug, lang }) => 
      getHelpPageData(slug, lang).then(data => ({
        slug,
        lang,
        success: data !== null,
        title: data?.title ?? null,
        hasBody: !!data?.body,
        bodyLength: data?.body?.length ?? 0
      }))
    )
  );

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};