/**
 * src/services/nodehive/auth.service.ts
 *
 * Servicio de autenticación de usuarios en NodeHive (Drupal).
 */

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: {
    uid: number;
    name: string;
    mail: string;
    sessid?: string;
    session_name?: string;
  };
}

/**
 * Autentica un usuario en NodeHive.
 */
export async function login(data: LoginData): Promise<LoginResult> {
  // TODO: Implementar cuando se configure el servicio de autenticación en NodeHive
  return {
    ok: false,
    error: 'Login no implementado aún.',
  };
}

/**
 * Cierra la sesión del usuario en NodeHive.
 */
export async function logout(): Promise<{ ok: boolean }> {
  // TODO: Implementar cuando se configure el servicio de logout en NodeHive
  return { ok: true };
}