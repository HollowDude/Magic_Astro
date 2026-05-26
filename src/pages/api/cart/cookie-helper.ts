const DRUPAL_S_COOKIE = 'drupal_s';

export function relayCartCookie(
  drupalHeaders: Headers,
  path: string,
): Record<string, string> {
  const setCookie = drupalHeaders.get('set-cookie');
  if (!setCookie) return {};

  const cookieMatch = setCookie.match(/^([^=]+=[^;]+)/);
  if (!cookieMatch) return {};

  const encoded = encodeURIComponent(cookieMatch[1]);
  const maxAge = 2000000;

  return {
    'Set-Cookie': `${DRUPAL_S_COOKIE}=${encoded}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  };
}
