import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { fetchRibbonColors, ribbonColorDefFromUuid } from '@/services/nodehive/nodehive.cart';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

interface RibbonColorInfo {
  name: string;
  hex: string;
}

interface CheckoutItemResponse {
  itemId: number;
  title: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variationId: number | null;
  thumbnailUrl: string | null;
  hasCard: boolean;
  cardMessage: string | null;
  ribbonColor: RibbonColorInfo | null;
  isAddition: boolean;
}

async function getVariationThumbnailMap(uuids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (uuids.length === 0) return map;

  const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');
  const valueParams = uuids.map(u => `filter[id][condition][value][]=${encodeURIComponent(u)}`).join('&');

  async function fetchForType(variationType: string, mediaField: string): Promise<void> {
    const params = new URLSearchParams();
    params.set('include', `${mediaField},${mediaField}.field_media_image`);
    const path = `/jsonapi/commerce_product_variation/${variationType}?filter[id][condition][path]=id&filter[id][condition][operator]=IN&${valueParams}&${params.toString()}`;

    try {
      const raw = await nodehiveFetch<Record<string, unknown>>(path, {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        skipApiKey: false,
        cacheTtl: 60_000,
      });
      if (raw.status !== 200) return;

      const data = raw.data as any;
      const included: Array<Record<string, any>> = data?.included ?? [];

      for (const item of data?.data ?? []) {
        const itemUuid = item?.id;
        if (!itemUuid) continue;

        const relData = item?.relationships?.[mediaField]?.data;
        const mediaId = Array.isArray(relData) ? relData[0]?.id : relData?.id;
        if (!mediaId) continue;

        const mediaEntity = included.find((inc: any) => inc.type === 'media--image' && inc.id === mediaId);
        const fileId = mediaEntity?.relationships?.field_media_image?.data?.id;
        if (!fileId) continue;

        const fileEntity = included.find((inc: any) => inc.type === 'file--file' && inc.id === fileId);
        const uri = fileEntity?.attributes?.uri?.url;
        if (uri) map.set(itemUuid, `${baseUrl}${uri}`);
      }
    } catch {
      // silent fail
    }
  }

  await Promise.all([
    fetchForType('flower', 'field_gallery_of_photos'),
    fetchForType('addition', 'field_photo'),
  ]);

  return map;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const orderUuid = url.searchParams.get('orderUuid');
  if (!orderUuid) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing orderUuid' }), { status: 400 });
  }

  try {
    const baseUrl = NODEHIVE_BASE_URL.replace(/\/+$/, '');
    const accessToken = session.accessToken ?? '';

    const orderRes = await fetch(
      `${baseUrl}/en/jsonapi/commerce_order/default/${orderUuid}` +
      `?include=order_items` +
      `&fields[commerce_order--default]=drupal_internal__order_id,total_price,order_items` +
      `&fields[commerce_order_item--default]=drupal_internal__order_item_id,title,quantity,unit_price,total_price,purchased_entity,field_has_card,field_card_message,field_ribbon_color`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
    );

    if (!orderRes.ok) {
      return new Response(JSON.stringify({ ok: false, items: [] }), { status: 200 });
    }

    const json = await orderRes.json();
    const attrs = json?.data?.attributes ?? {};
    const rels = json?.data?.relationships?.order_items?.data ?? [];
    const included = Array.isArray(json?.included) ? json.included : [];

    const variationUuids: string[] = [];
    const rawItems: Array<{
      inc: any;
      itemId: number;
      variationUuid: string | null;
    }> = [];

    for (const rel of rels) {
      const inc = included.find((i: any) => i.type === rel.type && i.id === rel.id);
      if (!inc) continue;
      const a = inc?.attributes ?? {};
      const itemId = a.drupal_internal__order_item_id ?? 0;
      if (!itemId) continue;

      const variationRel = inc?.relationships?.purchased_entity?.data;
      const variationUuid = variationRel?.id ?? null;
      if (variationUuid) variationUuids.push(variationUuid);

      rawItems.push({ inc, itemId, variationUuid });
    }

    const [ribbonColors, thumbnailMap] = await Promise.all([
      fetchRibbonColors(),
      getVariationThumbnailMap(variationUuids),
    ]);

    const items: CheckoutItemResponse[] = rawItems.map(({ inc, itemId, variationUuid }) => {
      const a = inc?.attributes ?? {};
      const ribbonRel = inc?.relationships?.field_ribbon_color?.data;
      const ribbonColorUuid = ribbonRel?.id ?? null;

      const variationRel2 = inc?.relationships?.purchased_entity?.data;
      return {
        itemId,
        title: a.title ?? '',
        quantity: parseFloat(a.quantity ?? '1') || 0,
        unitPrice: a.unit_price?.formatted ?? '',
        totalPrice: a.total_price?.formatted ?? '',
        variationId: null,
        thumbnailUrl: thumbnailMap.get(variationUuid ?? '') ?? null,
        hasCard: a.field_has_card ?? false,
        cardMessage: a.field_card_message ?? null,
        ribbonColor: ribbonColorDefFromUuid(ribbonColorUuid, ribbonColors),
        isAddition: variationRel2?.type?.includes('addition') ?? false,
      };
    });

    return new Response(
      JSON.stringify({
        ok: true,
        orderId: attrs.drupal_internal__order_id ?? 0,
        totalPrice: attrs.total_price?.formatted ?? '',
        items,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[checkout/items] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, items: [] }), { status: 200 });
  }
};
