import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { processDrupalErrors } from '@/services/nodehive/error-parser';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { status: 400 });
  }

  const { countryCode, addressLine1, addressLine2, locality, administrativeArea, postalCode, givenName, familyName, phone, label, isDefault } = body;

  const requiredFields: string[] = [];
  if (!countryCode) requiredFields.push('countryCode');
  if (!addressLine1) requiredFields.push('addressLine1');
  if (!locality) requiredFields.push('locality');

  // US requires state and ZIP
  if (countryCode === 'US') {
    if (!administrativeArea) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'State is required for US addresses.',
        field: 'administrativeArea',
      }), { status: 422 });
    }
    if (!postalCode) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'ZIP code is required for US addresses.',
        field: 'postalCode',
      }), { status: 422 });
    }
  }

  if (requiredFields.length > 0) {
    return new Response(JSON.stringify({
      ok: false,
      error: `Required fields missing: ${requiredFields.join(', ')}`,
    }), { status: 400 });
  }

  try {
    // Resolve user UUID from internal UID
    const userRes = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/user/user?filter[drupal_internal__uid]=${session.uid}&page[limit]=1`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      },
    );

    if (userRes.status !== 200) {
      return new Response(JSON.stringify({ ok: false, error: 'Failed to resolve user' }), { status: 500 });
    }

    const userList = (userRes.data as any)?.data ?? [];
    const userUuid = Array.isArray(userList) ? userList[0]?.id : null;
    if (!userUuid) {
      return new Response(JSON.stringify({ ok: false, error: 'User not found' }), { status: 404 });
    }

    const payload: Record<string, any> = {
      data: {
        type: 'profile--customer',
        attributes: {
          address: {
            country_code: countryCode,
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            locality,
            administrative_area: administrativeArea || null,
            postal_code: postalCode || null,
            given_name: givenName || null,
            family_name: familyName || null,
            organization: label || null,
          },
        },
        relationships: {
          uid: {
            data: { type: 'user--user', id: userUuid },
          },
        },
      },
    };

    if (isDefault) {
      payload.data.attributes.is_default = true;
    }

    // Use bearerToken for mutation that requires user-level auth
    const lang = body.lang || 'es';
    const res = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/profile/customer`,
      {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
      },
    );

    if (res.status >= 200 && res.status < 300) {
      const resultData = (res.data as any)?.data;
      if (!resultData) {
        return new Response(JSON.stringify({ ok: false, error: 'Empty response from Drupal' }), { status: 500 });
      }
      return new Response(JSON.stringify({
        ok: true,
        address: {
          id: resultData.id,
          internalId: resultData.attributes?.drupal_internal__profile_id,
          isDefault: resultData.attributes?.is_default ?? false,
        },
      }), { status: 200 });
    }

    const errors = (res.data as any)?.errors;
    const normalized = processDrupalErrors(errors, lang);
    return new Response(JSON.stringify({ ok: false, error: normalized.error, field: normalized.field }), { status: 422 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
