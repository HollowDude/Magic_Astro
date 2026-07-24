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
    // En register.service.ts, cambiar el endpoint y formato:
    const res = await fetch(`${NODEHIVE_BASE_URL}/user/register?_format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': NODEHIVE_API_KEY,
      },
      body: JSON.stringify({
        name: { value: data.username },
        mail: { value: data.email },
        pass: [{ value: data.password }],
      }),
    });;

    const json = await res.json().catch(() => ({}));

    console.log('[Register] Status:', res.status);
    console.log('[Register] Response:', JSON.stringify(json));

    if (!res.ok) {
      const detail =
        json?.errors?.[0]?.detail ??
        json?.message ??
        'No se pudo crear la cuenta.';
      return { ok: false, statusCode: res.status, error: detail };
    }

    return {
      ok: true,
      data: {
        uid:  json?.uid?.[0]?.value ?? 0,
        name: json?.name?.[0]?.value ?? data.username,
        mail: json?.mail?.[0]?.value ?? data.email,
      },
    };
  } catch (err) {
    console.error('[Register] Exception:', err);
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}
