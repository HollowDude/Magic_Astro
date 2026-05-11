/**
 * src/services/nodehive/register.service.ts
 *
 * Servicio de registro de usuarios en NodeHive (Drupal).
 */

const NODEHIVE_BASE_URL = import.meta.env.NODEHIVE_BASE_URL as string;
const NODEHIVE_API_KEY  = import.meta.env.NODEHIVE_API_KEY  as string;

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  data?: { uid: number; name: string; mail: string };
}

export async function register(data: RegisterData): Promise<RegisterResult> {
  try {
    const res = await fetch(`${NODEHIVE_BASE_URL}/jsonapi/user/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'api-key': NODEHIVE_API_KEY,
      },
      body: JSON.stringify({
        data: {
          type: 'user--user',
          attributes: {
            name:  data.username,
            mail:  data.email,
            pass: { value: data.password },
            status: true,
          },
        },
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = json?.errors?.[0]?.detail ?? json?.message ?? 'No se pudo crear la cuenta.';
      return { ok: false, statusCode: res.status, error: detail };
    }

    const attr = json?.data?.attributes;
    return {
      ok: true,
      data: {
        uid:  json?.data?.attributes?.drupal_internal__uid ?? 0,
        name: attr?.name ?? data.username,
        mail: attr?.mail ?? data.email,
      },
    };
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}
