const DRUPAL_S_COOKIE = 'drupal_s';
const MAX_AGE = 2000000;

export function relayCartCookie(
  drupalHeaders: Headers,
  existingRawValue?: string,
): Record<string, string> {
  let rawValue: string | null = null;

  const setCookie = drupalHeaders.get('set-cookie');
  if (setCookie) {
    const cookieMatch = setCookie.match(/^([^=]+=[^;]+)/);
    if (cookieMatch) rawValue = cookieMatch[1];
  }

  if (!rawValue && existingRawValue) {
    rawValue = decodeURIComponent(existingRawValue);
  }

  if (!rawValue) return {};

  const encoded = encodeURIComponent(rawValue);

  return {
    'Set-Cookie': `${DRUPAL_S_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`,
  };
}

/**
 * Convierte el valor crudo de la cookie drupal_s a un Cookie header apto para
 * enviar a Drupal. El valor crudo trae la cookie URL-encoded (SESS...%3Dvalor);
 * la decode para obtener el formato real que Drupal espera (SESS...=valor).
 *
 * Uso correcto:
 *   fetch(url, { headers: { Cookie: drupalCookieHeader(rawValue) } })
 */
export function drupalCookieHeader(drupalRawValue: string | undefined): string | undefined {
  if (!drupalRawValue) return undefined;
  return decodeURIComponent(drupalRawValue);
}
