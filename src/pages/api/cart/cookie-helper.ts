const DRUPAL_S_COOKIE = 'drupal_s';

export function relayCartCookie(
  drupalHeaders: Headers,
  _path?: string,
): Record<string, string> {
  const setCookie = drupalHeaders.get('set-cookie');
  if (!setCookie) return {};

  const cookieMatch = setCookie.match(/^([^=]+=[^;]+)/);
  if (!cookieMatch) return {};

  const encoded = encodeURIComponent(cookieMatch[1]);
  const maxAge = 2000000;

  return {
    'Set-Cookie': `${DRUPAL_S_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  };
}
