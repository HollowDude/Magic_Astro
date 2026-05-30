interface TransitionOrderStateParams {
  baseUrl: string;
  orderUuid: string;
  orderId?: number;
  drupalSession?: string;
  csrfToken: string;
  accessToken?: string;
  lang?: string;
}

export async function transitionOrderState(
  params: TransitionOrderStateParams,
): Promise<{ ok: boolean; state?: string; error?: string }> {
  const {
    baseUrl,
    orderUuid,
    csrfToken,
    accessToken,
    lang = 'en',
  } = params;

  const patchBody = {
    data: {
      type: 'commerce_order--default',
      id: orderUuid,
      attributes: {
        state: 'placed',
      },
    },
  };

  const patchUrl = `${baseUrl}/${lang}/jsonapi/commerce_order/default/${orderUuid}`;
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      'X-CSRF-Token': csrfToken,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(patchBody),
  });

  if (!patchRes.ok) {
    const err = await patchRes.text().catch(() => '');
    return { ok: false, error: `State transition PATCH failed (${patchRes.status}): ${err.slice(0, 300)}` };
  }

  return { ok: true, state: 'placed' };
}
