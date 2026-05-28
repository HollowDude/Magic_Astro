import { getPasswordStrength } from '@/utils/passwordValidation';

interface Props {
  value: string;
  lang?: 'es' | 'en';
}

const LABELS = {
  es: { weak: 'Débil', medium: 'Media', strong: 'Fuerte' },
  en: { weak: 'Weak', medium: 'Medium', strong: 'Strong' },
};

export default function PasswordStrengthBar({ value, lang = 'es' }: Props) {
  if (!value) return null;

  const strength = getPasswordStrength(value);
  const t = LABELS[lang] ?? LABELS.es;

  const segments =
    strength === 'weak' ? [1, 0, 0]
    : strength === 'medium' ? [1, 1, 0]
    : [1, 1, 1];

  const colors = ['#ef4444', '#eab308', '#16a34a'];
  const label = t[strength];

  return (
    <div className="pw-strength">
      <div className="pw-bar">
        {segments.map((active, i) => (
          <span
            key={i}
            className="pw-segment"
            style={{ background: active ? colors[i] : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="pw-label" style={{ color: colors[segments.indexOf(1)] }}>
        {label}
      </span>
      <style>{`
        .pw-strength {
          display: flex; align-items: center; gap: 0.5rem; padding: 0 0.25rem;
        }
        .pw-bar {
          display: flex; gap: 4px; flex: 1; max-width: 120px;
        }
        .pw-segment {
          flex: 1; height: 4px; border-radius: 2px;
          transition: background 0.2s;
        }
        .pw-label {
          font-size: 0.75rem; font-weight: 600; white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
