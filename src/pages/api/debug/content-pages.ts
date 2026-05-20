import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';

const dataFormatter = new Jsona();

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') as string) || 'en';
  
  const nodeParams = new DrupalJsonApiParams();
  nodeParams
    .addFields('node--content_page', ['id', 'title', 'drupal_internal__nid'])
    .addPageLimit(20);

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
    const simplified = pages.map((p: any) => ({
      id: p.id,
      title: p.title,
      drupal_internal__nid: p.attributes?.drupal_internal__nid
    }));

    return new Response(JSON.stringify({ lang, count: pages.length, pages: simplified }, null, 2), {
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