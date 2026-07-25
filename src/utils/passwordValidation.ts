export function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  if (!/[a-zA-Z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  return true;
}

export function getPasswordStrength(value: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^a-zA-Z\d]/.test(value)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
