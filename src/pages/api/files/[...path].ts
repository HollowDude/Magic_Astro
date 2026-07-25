import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export const GET: APIRoute = async ({ params }) => {
  const filePath = params.path;
  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  // Prevent directory traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(UPLOADS_DIR, safePath);

  if (!fullPath.startsWith(UPLOADS_DIR)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!existsSync(fullPath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(fullPath).slice(1).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  try {
    const buffer = await readFile(fullPath);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Error reading file', { status: 500 });
  }
};
