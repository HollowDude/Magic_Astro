import type { APIRoute } from 'astro';

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export const GET: APIRoute = async ({ url }) => {
  const fileUrl = url.searchParams.get('url');
  if (!fileUrl) {
    return new Response('Missing url param', { status: 400 });
  }

  const decodedUrl = decodeURIComponent(fileUrl);

  if (!decodedUrl.startsWith(NODEHIVE_BASE_URL)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const res = await fetch(decodedUrl, {
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      return new Response('Not found', { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Proxy error', { status: 502 });
  }
};