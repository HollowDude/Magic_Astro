import { nodehiveFetch } from './nodehive.client';
import Jsona from 'jsona';
import type { Lang } from '@/i18n/ui';

const dataFormatter = new Jsona();

export interface UserProfile {
  uid: string;
  username: string;
  mail: string;
  displayName: string;
  phone: string | null;
  userPicture: string | null;
}

export interface UserAddress {
  id: string;
  internalId: number | null;
  bundle: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  phone: string | null;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  unitPriceFormatted: string;
  thumbnailUrl: string | null;
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  state: string;
  stateLabel: string;
  placedTimestamp: number | null;
  placedDateFormatted: string;
  totalFormatted: string;
  itemCount: number;
  items: OrderItem[];
}

const ORDER_STATE_LABELS: Record<string, { es: string; en: string }> = {
  draft:       { es: 'Borrador',       en: 'Draft' },
  placed:      { es: 'En preparación', en: 'Processing' },
  fulfillment: { es: 'En camino',      en: 'Shipped' },
  completed:   { es: 'Entregado',      en: 'Delivered' },
  canceled:    { es: 'Cancelado',      en: 'Canceled' },
  validation:  { es: 'Pendiente',      en: 'Pending' },
};

function formatOrderDate(timestamp: number | null, lang: Lang): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export async function getUserProfile(
  uid: string,
  lang?: Lang,
  accessToken?: string,
): Promise<UserProfile | null> {
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/user/user?filter[drupal_internal__uid]=${uid}&page[limit]=1`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
        cacheTtl: 0,
      },
    );
    if (raw.status !== 200) {
      console.error(`[User] getUserProfile HTTP ${raw.status}`);
      return null;
    }

    const result = dataFormatter.deserialize(raw.data) as any[];
    const user = Array.isArray(result) ? result[0] : result;
    if (!user) return null;

    let username = '';
    let mail = '';
    let displayName = user.display_name ?? '';
    let userPictureUrl: string | null = null;

    const uidFromJson = user.drupal_internal__uid;
    const numericUid = String(uidFromJson ?? uid);

    // JSON:API solo expone display_name, intentar con REST para name y mail
    if (accessToken) {
      try {
        const restRes = await nodehiveFetch<Record<string, unknown>>(
          `/user/${numericUid}?_format=json`,
          {
            headers: { Accept: 'application/json' },
            lang,
            bearerToken: accessToken,
            cacheTtl: 0,
          },
        );
        if (restRes.status === 200) {
          const restData = restRes.data as Record<string, any>;
          username = restData?.name?.[0]?.value ?? displayName;
          mail = restData?.mail?.[0]?.value ?? '';
          const pictureData = restData?.user_picture?.[0];
          if (pictureData?.url) {
            userPictureUrl = pictureData.url;
          }
        }
      } catch {
        // fallback si falla REST
      }
    }

    return {
      uid,
      username: username || displayName,
      mail,
      displayName,
      phone: user.field_phone_number ?? user.field_phone ?? null,
      userPicture: userPictureUrl,
    };
  } catch (err) {
    console.error('[User] getUserProfile error:', err);
    return null;
  }
}

export async function getUserAddresses(uid: string, lang?: Lang, bearerToken?: string): Promise<UserAddress[]> {
  const bundlesToTry = ['customer'];

  for (const bundle of bundlesToTry) {
    try {
      const raw = await nodehiveFetch<Record<string, unknown>>(
        `/jsonapi/profile/${bundle}?page[limit]=10`,
        {
          headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
          lang,
          bearerToken,
          cacheTtl: 0,
        },
      );

      if (raw.status === 200) {
        const result = dataFormatter.deserialize(raw.data) as any[];
        const profiles = Array.isArray(result) ? result : [];
        if (profiles.length > 0 || bundle === bundlesToTry[bundlesToTry.length - 1]) {
          return profiles.map((p: any): UserAddress => {
            const addr = p.address ?? {};
            return {
              id: p.id ?? '',
              internalId: p.drupal_internal__profile_id ?? null,
              bundle,
              label: addr.organization ?? null,
              firstName: addr.given_name ?? null,
              lastName: addr.family_name ?? null,
              addressLine1: addr.address_line1 ?? null,
              addressLine2: addr.address_line2 ?? null,
              city: addr.locality ?? null,
              state: addr.administrative_area ?? null,
              postalCode: addr.postal_code ?? null,
              countryCode: addr.country_code ?? null,
              phone: null,
              isDefault: p.is_default ?? false,
            };
          });
        }
      }
    } catch {
      /* intentar siguiente bundle */
    }
  }
  return [];
}

export async function getUserOrders(
  uid: string,
  lang: Lang = 'es',
  limit = 5,
): Promise<UserOrder[]> {
  try {
    const raw = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/commerce_order/default?` +
      `filter[uid.drupal_internal__uid]=${uid}` +
      `&include=order_items` +
      `&sort=-placed` +
      `&page[limit]=${limit}`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
      },
    );

    if (raw.status !== 200) {
      console.error(`[User] getUserOrders HTTP ${raw.status}`);
      return [];
    }

    const result = dataFormatter.deserialize(raw.data) as any[];
    const orders = Array.isArray(result) ? result : [];

    return orders.map((o: any): UserOrder => {
      const stateKey = o.state ?? 'placed';
      const labelObj = ORDER_STATE_LABELS[stateKey] ?? { es: stateKey, en: stateKey };
      const stateLabel = labelObj[lang] ?? labelObj.es;

      let placedTimestamp: number | null = null;
      if (typeof o.placed === 'number') {
        placedTimestamp = o.placed;
      } else if (typeof o.placed === 'string') {
        const d = new Date(o.placed);
        if (!isNaN(d.getTime())) placedTimestamp = Math.floor(d.getTime() / 1000);
      }

      const items = Array.isArray(o.order_items) ? o.order_items : [];

      return {
        id: o.id ?? '',
        orderNumber: o.order_number ?? o.drupal_internal__order_id ?? o.id ?? '—',
        state: stateKey,
        stateLabel,
        placedTimestamp,
        placedDateFormatted: formatOrderDate(placedTimestamp, lang),
        totalFormatted: o.total_price?.formatted ?? o.order_total?.formatted ?? '',
        itemCount: items.length,
        items: items.map((item: any): OrderItem => ({
          id: item.id ?? '',
          title: item.title ?? '',
          quantity: parseFloat(item.quantity ?? '1'),
          unitPriceFormatted: item.unit_price?.formatted ?? '',
          thumbnailUrl: null,
        })),
      };
    });
  } catch (err) {
    console.error('[User] getUserOrders error:', err);
    return [];
  }
}
