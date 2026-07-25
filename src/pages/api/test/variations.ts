import type { APIRoute } from 'astro';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

export const GET: APIRoute = async () => {
  const res = await nodehiveFetch(
    '/jsonapi/commerce_product/flower?include=variations,variations.field_gallery_of_photos,variations.field_gallery_of_photos.field_media_image,variations.field_color&page[limit]=3',
    { headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' } }
  );
  return new Response(JSON.stringify(res.data, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
};