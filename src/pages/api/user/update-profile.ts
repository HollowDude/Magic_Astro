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

  const { displayName, mail, currentPassword, newPassword } = body;

  if (!currentPassword) {
    return json({ ok: false, error: 'Your current password is required to update your profile.' }, 400);
  }

  let userUuid: string | null = null;
  try {
    const userRes = await nodehiveFetch<Record<string, unknown>>(
      `/jsonapi/user/user?filter[drupal_internal__uid]=${session.uid}&page[limit]=1`,
      {
        headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
        bearerToken: session.accessToken,
      },
    );
    if (userRes.status === 200) {
      const userList = (userRes.data as any)?.data ?? [];
      userUuid = Array.isArray(userList) ? userList[0]?.id : null;
    }
  } catch {
    userUuid = null;
  }

  if (!userUuid) {
    return json({ ok: false, error: 'User not found' }, 404);
  }

  const attributes: Record<string, unknown> = {};
  if (body.displayName !== undefined) attributes.name = displayName;
  if (body.mail !== undefined) attributes.mail = mail;

  const hasNewPassword = typeof newPassword === 'string' && newPassword.length > 0;
  const hasProfileChanges = body.displayName !== undefined || body.mail !== undefined;

  if (!hasProfileChanges && !hasNewPassword) {
    return json({ ok: false, error: 'No fields to update' }, 400);
  }

  attributes.pass = hasNewPassword
    ? { value: newPassword, existing: currentPassword }
    : { value: currentPassword, existing: currentPassword };

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
