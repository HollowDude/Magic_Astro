/**
 * src/services/nodehive/register.service.ts
 *
 * Servicio de registro de usuarios en NodeHive (Drupal).
 */

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: {
    uid: number;
    name: string;
    mail: string;
  };
}

/**
 * Registra un nuevo usuario en NodeHive.
 */
export async function register(data: RegisterData): Promise<RegisterResult> {
  // TODO: Implementar cuando se configure el servicio de registro en NodeHive
  return {
    ok: false,
    error: 'Registro no implementado aún.',
  };
}