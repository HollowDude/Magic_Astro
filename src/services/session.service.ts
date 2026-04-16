import type { AstroCookies } from 'astro';
import type { SessionUser } from '@/types/auth';
import { EncryptJWT, jwtDecrypt, type JWTPayload } from 'jose';

const COOKIE_NAME     = 'mf_session';
const SESSION_MAX_AGE = Number(import.meta.env.SESSION_MAX_AGE ?? 86400);

// SESSION_SECRET debe tener ≥ 32 caracteres ASCII (se toman los primeros 32 bytes).
const _secret = import.meta.env.SESSION_SECRET as string | undefined;
if (!_secret || _secret.length < 32) {
  throw new Error(
    '[Session] SESSION_SECRET no está definida o tiene menos de 32 caracteres.\n' +
    'Generá una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
  );
}
const ENC_KEY = new TextEncoder().encode(_secret).slice(0, 32);

// ── Guardar sesión ──────────────────────────────────────────────────────────

export async function setSession(cookies: AstroCookies, user: SessionUser): Promise<void> {
  const payload: JWTPayload = {
    uid:         user.uid,
    name:        user.name,
    roles:       user.roles,
    csrfToken:   user.csrfToken,
    logoutToken: user.logoutToken,
  };

  const token = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(ENC_KEY);

  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   import.meta.env.PROD,
    sameSite: 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });
}

// ── Leer sesión ─────────────────────────────────────────────────────────────

export async function getSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const { payload } = await jwtDecrypt(raw, ENC_KEY);
    return {
      uid:         payload['uid']         as string,
      name:        payload['name']        as string,
      roles:       payload['roles']       as string[],
      csrfToken:   payload['csrfToken']   as string,
      logoutToken: payload['logoutToken'] as string,
    };
  } catch {
    // Token expirado, inválido o manipulado
    return null;
  }
}

// ── Destruir sesión ─────────────────────────────────────────────────────────

export function destroySession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}