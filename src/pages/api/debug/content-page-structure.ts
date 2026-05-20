import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import Jsona from 'jsona';

const dataFormatter = new Jsona();

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') as string) || 'en';
  const id = searchParams.get('id') || 'b2d45981-7959-455a-8417-5a4fb897582b'; // About page

  const nodeParams = new DrupalJsonApiParams();
  nodeParams
    .addInclude(['field_component'])
    .addFields('node--content_page', ['id', 'title', 'drupal_internal__nid', 'field_component'])
    .addPageLimit(1);

  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/node/content_page/${id}?${nodeParams.getQueryString()}`,
      { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, lang }
    );

    if (raw.status !== 200) {
      return new Response(JSON.stringify({ error: `HTTP ${raw.status}`, url: `/jsonapi/node/content_page/${id}?${nodeParams.getQueryString()}`, lang }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deserialized = dataFormatter.deserialize(raw.data);
    
    return new Response(JSON.stringify({
      lang,
      id,
      raw: {
        data: raw.data,
        included: raw.data?.included
      },
      deserialized: Array.isArray(deserialized) ? deserialized[0] : deserialized
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