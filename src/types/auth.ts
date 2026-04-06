// ─── Petición de login ─────────────────────────────────────────────────────
export interface LoginCredentials {
  username: string;
  password: string;
}

// ─── Respuesta de Drupal al autenticar ─────────────────────────────────────
export interface DrupalLoginResponse {
  current_user: {
    uid: string;
    roles: string[];
    name: string;
  };
  csrf_token: string;
  logout_token: string;
}

// ─── Usuario de sesión (lo que guardamos en la cookie) ──────────────────────
export interface SessionUser {
  uid: string;
  name: string;
  roles: string[];
  csrfToken: string;
  logoutToken: string;
}

// ─── Resultado genérico de un servicio ─────────────────────────────────────
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; statusCode?: number };
