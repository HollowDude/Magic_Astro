import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads/profiles');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

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

  const { fileBase64, fileName, mimeType } = body;

  if (!fileBase64 || !fileName) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing fileBase64 or fileName' }), { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return new Response(JSON.stringify({ ok: false, error: 'Only JPG, PNG, WebP and GIF images are allowed' }), { status: 400 });
  }

  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid file extension' }), { status: 400 });
  }

  const filename = `${session.uid}.${ext}`;

  try {
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    // Remove data:image/...;base64, prefix if present
    const base64Data = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    // Delete old profile picture of this user
    if (existsSync(UPLOADS_DIR)) {
      const { readdirSync, unlinkSync } = await import('node:fs');
      const files = readdirSync(UPLOADS_DIR);
      for (const f of files) {
        if (f.startsWith(`${session.uid}.`) && f !== filename) {
          try { unlinkSync(path.join(UPLOADS_DIR, f)); } catch { /* ignore */ }
        }
      }
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    await writeFile(filePath, buffer);

    const url = `/api/files/profiles/${filename}`;

    return new Response(JSON.stringify({ ok: true, url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
