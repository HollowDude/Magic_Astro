import type { APIRoute } from 'astro';
import { getSession } from '@/services/session.service';
import { readdirSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads/profiles');

export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  try {
    if (existsSync(UPLOADS_DIR)) {
      const files = readdirSync(UPLOADS_DIR);
      for (const f of files) {
        if (f.startsWith(`${session.uid}.`)) {
          try { unlinkSync(path.join(UPLOADS_DIR, f)); } catch { /* ignore */ }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};