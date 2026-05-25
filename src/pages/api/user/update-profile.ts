import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { nodehiveFetch } from '@/services/nodehive/nodehive.client';
import { processDrupalErrors } from '@/services/nodehive/error-parser';

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  if (!session) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  if (!session.accessToken) {
    return json({ ok: false, error: 'Session token expired, please log in again' }, 401);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { displayName, mail, userUuid, currentPassword } = body;

  if (!userUuid) {
    return json({ ok: false, error: 'User UUID is required' }, 400);
  }

  if (!currentPassword) {
    return json({ ok: false, error: 'Your current password is required to update your profile.' }, 400);
  }

  const attributes: Record<string, unknown> = {};
  if (body.displayName !== undefined) attributes.name = displayName;
  if (body.mail !== undefined) attributes.mail = mail;

  // Drupal requires current password verification for name/mail changes
  attributes.pass = { value: currentPassword, existing: currentPassword };

  if (Object.keys(attributes).length <= 1) {
    return json({ ok: false, error: 'No fields to update' }, 400);
  }

  try {
    const res = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/user/user/${userUuid}`,
      {
        method: 'PATCH',
        body: {
          data: {
            type: 'user--user',
            id: userUuid,
            attributes,
          },
        },
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        bearerToken: session.accessToken,
      },
    );

    if (res.status >= 200 && res.status < 300) {
      const data = (res.data as any)?.data;
      return json({
        ok: true,
        user: {
          name: data?.attributes?.name ?? displayName,
          mail: data?.attributes?.mail ?? mail,
        },
      }, 200);
    }

    const errors = (res.data as any)?.errors;
    const normalized = processDrupalErrors(errors, 'en');
    return json({ ok: false, error: normalized.error }, 422);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
};
