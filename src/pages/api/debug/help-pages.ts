import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';

const dataFormatter = new Jsona();

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') as string) || 'en';
  
  // First get all content pages that have the _component_footer_help paragraph
  const nodeParams = new DrupalJsonApiParams();
  nodeParams
    .addInclude(['field_component'])
    .addFields('node--content_page', ['id', 'title', 'drupal_internal__nid', 'field_component'])
    .addFilter('field_component.type', 'paragraph--_component_footer_help')
    .addPageLimit(50);

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/node/content_page?${nodeParams.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang }
    );

    if (raw.status !== 200) {
      return new Response(JSON.stringify({ error: `HTTP ${raw.status}`, url: `/jsonapi/node/content_page?${nodeParams.getQueryString()}`, lang }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pages = (dataFormatter.deserialize(raw.data) as any[]) ?? [];
    
    // For each page, get the paragraph details
    const pagesWithHelp = await Promise.all(
      pages.map(async (page: any) => {
        // Find the _component_footer_help paragraph in field_component
        const components: any[] = Array.isArray(page.field_component) ? page.field_component : [];
        const helpParagraph = components.find((c: any) => c?.type === 'paragraph--_component_footer_help');
        
        if (!helpParagraph?.id) {
          return null;
        }
        
        // Fetch the paragraph details
        try {
          const paraRaw = await nodehiveFetch<Record<string, unknown>>(
            `/jsonapi/paragraph/_component_footer_help/${helpParagraph.id}`,
            { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang }
          );
          
          if (paraRaw.status !== 200) {
            return {
              page: {
                id: page.id,
                title: page.title,
                drupal_internal__nid: page.attributes?.drupal_internal__nid
              },
              paragraph: null,
              error: `HTTP ${paraRaw.status} fetching paragraph`
            };
          }
          
          const rawParaItem = (paraRaw.data as any)?.data ?? null;
          const attrs = rawParaItem?.attributes ?? {};
          
          return {
            page: {
              id: page.id,
              title: page.title,
              drupal_internal__nid: page.attributes?.drupal_internal__nid
            },
            paragraph: {
              id: rawParaItem?.id,
              internalId: attrs.drupal_internal__id,
              title: attrs.field_title,
              body: attrs.field_body?.processed ?? attrs.field_body?.value ?? null
            }
          };
        } catch (err) {
          return {
            page: {
              id: page.id,
              title: page.title,
              drupal_internal__nid: page.attributes?.drupal_internal__nid
            },
            paragraph: null,
            error: String(err)
          };
        }
      })
    );
    
    // Filter out null values
    const validPages = pagesWithHelp.filter((p): p is NonNullable<typeof p> => p !== null);
    
    return new Response(JSON.stringify({ 
      lang, 
      count: validPages.length, 
      pages: validPages 
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