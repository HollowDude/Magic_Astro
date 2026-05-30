interface TransitionOrderStateParams {
  baseUrl: string;
  orderUuid: string;
  orderId: number;
  drupalSession: string;
  csrfToken: string;
  accessToken?: string;
  lang?: string;
}

function extractFormField(html: string, fieldName: string): string | null {
  const regex = new RegExp(`name="${fieldName}"\\s+value="([^"]+)"`);
  const match = html.match(regex);
  return match ? match[1] : null;
}

export async function transitionOrderState(
  params: TransitionOrderStateParams,
): Promise<{ ok: boolean; state?: string; error?: string }> {
  const {
    baseUrl,
    orderUuid,
    orderId,
    drupalSession,
    csrfToken,
    accessToken,
    lang = 'en',
  } = params;

  const cookieHeader = `drupal_s=${encodeURIComponent(drupalSession)}`;

  // Step 1: PATCH checkout_step to "review" via JSONAPI
  const patchBody = {
    data: {
      type: 'commerce_order--default',
      id: orderUuid,
      attributes: {
        checkout_step: 'review',
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
    return { ok: false, error: `checkout_step PATCH failed (${patchRes.status}): ${err.slice(0, 300)}` };
  }

  // Step 2: GET the review page to extract form_build_id / form_token / form_id
  const reviewUrl = `${baseUrl}/${lang}/checkout/${orderId}/review`;
  const reviewRes = await fetch(reviewUrl, {
    headers: { Cookie: cookieHeader },
    redirect: 'manual',
  });

  if (reviewRes.status === 302 || reviewRes.status === 301) {
    const location = reviewRes.headers.get('location') || 'unknown';
    return { ok: false, error: `Checkout redirected to ${location} — checkout_step may not have been applied` };
  }
  if (!reviewRes.ok) {
    return { ok: false, error: `Review page returned ${reviewRes.status}` };
  }

  const html = await reviewRes.text();
  const formBuildId = extractFormField(html, 'form_build_id');
  const formToken = extractFormField(html, 'form_token');
  const formId = extractFormField(html, 'form_id');
  const opValue = extractFormField(html, 'op') || 'Complete checkout';

  if (!formBuildId || !formToken || !formId) {
    return { ok: false, error: 'Could not extract checkout form fields from review page' };
  }

  // Step 3: POST the form to trigger state machine transition
  const formData = new URLSearchParams({
    form_build_id: formBuildId,
    form_token: formToken,
    form_id: formId,
    op: opValue,
  });

  const submitRes = await fetch(reviewUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
    },
    body: formData.toString(),
    redirect: 'manual',
  });

  const success = submitRes.status === 302 || (submitRes.status === 200 && submitRes.headers.get('location')?.includes('/complete'));
  if (!success) {
    return { ok: false, error: `Review form POST returned ${submitRes.status}` };
  }

  return { ok: true };
}
