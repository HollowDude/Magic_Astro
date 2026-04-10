// src/types/auth.ts

// ─── Credenciales ──────────────────────────────────────────────────────────
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// ─── Respuesta de Drupal: login (REST /user/login) ─────────────────────────
export interface DrupalLoginResponse {
  current_user: {
    uid: string;
    roles: string[];
    name: string;
  };
  csrf_token: string;
  logout_token: string;
}

// ─── Respuesta de Drupal: registro (JSON:API /jsonapi/user/user) ───────────
// El tipo completo lo maneja internamente register.service.ts
// Se exporta solo para tests o extensiones futuras
export interface DrupalRegisterResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      drupal_internal__uid: number;
      name: string;
      mail: string;
    };
  };
}

// ─── Usuario de sesión (cookie HTTP-only) ──────────────────────────────────
export interface SessionUser {
  uid: string;
  name: string;
  roles: string[];
  csrfToken: string;
  logoutToken: string;
}

// ─── Resultado genérico de servicio ────────────────────────────────────────
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; statusCode?: number };