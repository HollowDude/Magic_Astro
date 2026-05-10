import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));

    console.log('[NodeHive Revalidate] Webhook received:', JSON.stringify(body));

    const { type, id, event } = body;

    if (type && id) {
      console.log(`[NodeHive Revalidate] ${event ?? 'update'} for ${type}:${id}`);
    }

    return new Response(
      JSON.stringify({ 
        revalidated: true, 
        timestamp: new Date().toISOString(),
        received: body 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[NodeHive Revalidate] Error:', err);
    return new Response(
      JSON.stringify({ revalidated: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ status: 'ok', message: 'NodeHive revalidate endpoint active' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};