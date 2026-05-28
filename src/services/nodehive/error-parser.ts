/**
 * Normaliza errores de Drupal JSON:API a respuestas amigables para el frontend.
 *
 * Drupal devuelve errores como:
 *   "address.0.administrative_area: State field is required."
 *   "address.0.postal_code: Zip code field is required."
 *   "address.0.administrative_area: Province field is not in the right format."
 *   "address: This value should not be null."
 */

const FIELD_MAP: Record<string, string> = {
  'address.0.administrative_area': 'administrativeArea',
  'address.0.postal_code': 'postalCode',
  'address.0.address_line1': 'addressLine1',
  'address.0.address_line2': 'addressLine2',
  'address.0.locality': 'locality',
  'address.0.country_code': 'countryCode',
  'address.0.given_name': 'givenName',
  'address.0.family_name': 'familyName',
  'address.0.organization': 'label',
};

interface NormalizedError {
  error: string;
  field?: string;
}

const FRIENDLY_MESSAGES: Record<string, Record<string, string>> = {
  es: {
    'State field is required': 'El estado es obligatorio para direcciones en Estados Unidos.',
    'Province field is not in the right format': 'El valor del estado/provincia no es válido.',
    'Zip code field is required': 'El código postal es obligatorio para direcciones en Estados Unidos.',
    'First name field is required': 'El nombre es obligatorio.',
    'Last name field is required': 'El apellido es obligatorio.',
    'This value should not be null': 'Este campo es obligatorio.',
    'The address is incomplete': 'La dirección está incompleta o contiene datos inválidos.',
    'Your current password is missing or incorrect': 'La contraseña actual no es correcta.',
    'The password is invalid': 'La contraseña no es válida.',
    'The password does not match': 'La contraseña no coincide.',
    'Password is required': 'La contraseña es obligatoria.',
  },
  en: {
    'State field is required': 'State is required for US addresses.',
    'Province field is not in the right format': 'The state/province value is not valid.',
    'Zip code field is required': 'ZIP code is required for US addresses.',
    'First name field is required': 'First name is required.',
    'Last name field is required': 'Last name is required.',
    'This value should not be null': 'This field is required.',
    'The address is incomplete': 'The address is incomplete or contains invalid data.',
    'Your current password is missing or incorrect': 'Your current password is incorrect.',
    'The password is invalid': 'The password is invalid.',
    'The password does not match': 'The password does not match.',
    'Password is required': 'Password is required.',
  },
};

function matchFriendly(rawDetail: string, lang: string): string {
  const dict = FRIENDLY_MESSAGES[lang] ?? FRIENDLY_MESSAGES.en;
  for (const [pattern, friendly] of Object.entries(dict)) {
    if (rawDetail.includes(pattern)) return friendly;
  }
  return rawDetail;
}

/**
 * Parsea el detail de un error de Drupal y devuelve un error amigable.
 *
 * @param rawDetail - El string detail del error de Drupal
 *                    ej: "address.0.administrative_area: State field is required."
 * @param lang      - 'es' | 'en' para el mensaje traducido
 */
export function normalizeDrupalError(rawDetail: string, lang: string = 'es'): NormalizedError {
  // Intentar extraer field path: "address.0.XXXX: message"
  const match = rawDetail.match(/^([^:]+):\s*(.+)$/);
  if (match) {
    const fieldPath = match[1].trim();
    const rawMessage = match[2].trim();
    const friendlyMessage = matchFriendly(rawDetail, lang);

    const field = FIELD_MAP[fieldPath];
    if (field) {
      return { error: friendlyMessage, field };
    }

    // Si el field path empieza con "address" (ej: "address: This value should not be null")
    if (fieldPath === 'address' || fieldPath.startsWith('address.')) {
      return { error: friendlyMessage };
    }

    return { error: friendlyMessage };
  }

  // Si no se pudo parsear el formato "path: message"
  const friendly = matchFriendly(rawDetail, lang);
  return { error: friendly };
}

/**
 * Procesa el array de errores de una respuesta JSON:API de Drupal.
 * Devuelve el primer error normalizado.
 */
export function processDrupalErrors(
  errors: Array<{ detail?: string }> | undefined,
  lang: string = 'es',
): NormalizedError {
  if (!errors || errors.length === 0) {
    return { error: lang === 'es' ? 'Error desconocido del servidor.' : 'Unknown server error.' };
  }

  const first = errors[0];
  if (first.detail) {
    return normalizeDrupalError(first.detail, lang);
  }

  return { error: lang === 'es' ? 'Error desconocido del servidor.' : 'Unknown server error.' };
}
