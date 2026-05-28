import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { processDrupalErrors } from '@/services/nodehive/error-parser';

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  if (!session.accessToken) {
    return new Response(JSON.stringify({ ok: false, error: 'Session token expired, please log in again' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { status: 400 });
  }

  const { id, countryCode, addressLine1, addressLine2, locality, administrativeArea, postalCode, givenName, familyName, label, isDefault } = body;

  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Profile id is required' }), { status: 400 });
  }

  try {
    const lang = body.lang || 'es';

    // Fetch existing profile to merge with changes
    const existingRes = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/profile/customer/${id}`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
      },
    );

    if (existingRes.status !== 200) {
      return new Response(JSON.stringify({ ok: false, error: 'Address not found' }), { status: 404 });
    }

    const existingData = (existingRes.data as any)?.data;
    if (!existingData) {
      return new Response(JSON.stringify({ ok: false, error: 'Address not found' }), { status: 404 });
    }

    const currentAddress = existingData.attributes?.address ?? {};

    // Build merged address
    const address: Record<string, any> = {
      country_code: countryCode ?? currentAddress.country_code ?? 'US',
      address_line1: addressLine1 ?? currentAddress.address_line1 ?? '',
      address_line2: addressLine2 !== undefined ? (addressLine2 || null) : (currentAddress.address_line2 ?? null),
      locality: locality ?? currentAddress.locality ?? '',
      administrative_area: administrativeArea !== undefined ? (administrativeArea || null) : (currentAddress.administrative_area ?? null),
      postal_code: postalCode !== undefined ? (postalCode || null) : (currentAddress.postal_code ?? null),
      given_name: givenName !== undefined ? (givenName || null) : (currentAddress.given_name ?? null),
      family_name: familyName !== undefined ? (familyName || null) : (currentAddress.family_name ?? null),
      organization: label !== undefined ? (label || null) : (currentAddress.organization ?? null),
    };

    // Validate US requirements after merge
    const mergedCountry = address.country_code;
    const mergedState = address.administrative_area;
    const mergedZip = address.postal_code;
    if (mergedCountry === 'US') {
      if (!mergedState) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'State is required for US addresses.',
          field: 'administrativeArea',
        }), { status: 422 });
      }
      if (!mergedZip) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'ZIP code is required for US addresses.',
          field: 'postalCode',
        }), { status: 422 });
      }
    }

    const attributes: Record<string, any> = { address };
    if (isDefault !== undefined) {
      attributes.is_default = isDefault;
    }

    const payload = {
      data: {
        type: 'profile--customer',
        id,
        attributes,
      },
    };

    const res = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/profile/customer/${id}`,
      {
        method: 'PATCH',
        body: payload,
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        lang,
        bearerToken: session.accessToken,
      },
    );

    if (res.status >= 200 && res.status < 300) {
      const resultData = (res.data as any)?.data;
      return new Response(JSON.stringify({
        ok: true,
        address: resultData ? {
          id: resultData.id,
          internalId: resultData.attributes?.drupal_internal__profile_id,
          isDefault: resultData.attributes?.is_default ?? false,
        } : null,
      }), { status: 200 });
    }

    const errors = (res.data as any)?.errors;
    const normalized = processDrupalErrors(errors, lang);
    return new Response(JSON.stringify({ ok: false, error: normalized.error, field: normalized.field }), { status: 422 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
