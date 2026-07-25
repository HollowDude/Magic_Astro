const SESSION_ERRORS = [
  'Session token expired, please log in again',
  'Unauthorized',
  'Session token expired',
];

function isSessionError(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const msg = ((data as any).error ?? '').toLowerCase();
  return SESSION_ERRORS.some(e => msg.includes(e.toLowerCase()));
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    const text = await res.text().catch(() => '');
    try {
      const data = JSON.parse(text);
      if (isSessionError(data)) {
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
    } catch { /* not JSON */ }
  }

  return res;
}
