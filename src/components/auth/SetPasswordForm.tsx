// src/components/auth/SetPasswordForm.tsx
import { useState } from 'react';
import InputField from '@/components/ui/InputField';
import Alert from '@/components/ui/Alert';
import type { Lang } from '@/i18n/ui';

type AlertType = 'error' | 'success';

interface AlertState {
  type: AlertType;
  message: string;
}

interface Props {
  lang?: Lang;
  uid: string;
  timestamp: string;
  hash: string;
}

const TRANSLATIONS = {
  es: {
    title: 'Activar tu cuenta',
    subtitle: 'Establece una contraseña para acceder a tu nueva cuenta.',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres',
    confirmLabel: 'Confirmar contraseña',
    confirmPlaceholder: 'Repite tu contraseña',
    submitButton: 'Activar cuenta',
    errorEmpty: 'Completa todos los campos para continuar.',
    errorPasswordMismatch: 'Las contraseñas no coinciden.',
    errorPasswordWeak: 'Usa al menos 8 caracteres e incluye una letra y un número.',
    errorServer: 'No pudimos conectar con el servidor. Intenta otra vez.',
    errorLink: 'El enlace de activación es inválido o ha expirado.',
    success: (name: string) => `¡Bienvenido, ${name}! Redirigiendo...`,
    successManual: '¡Contraseña establecida! Redirigiendo al login...',
  },
  en: {
    title: 'Activate your account',
    subtitle: 'Set a password to access your new account.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Repeat your password',
    submitButton: 'Activate account',
    errorEmpty: 'Please fill in all fields to continue.',
    errorPasswordMismatch: 'Passwords do not match.',
    errorPasswordWeak: 'Use at least 8 characters with a letter and a number.',
    errorServer: 'Could not connect to server. Try again.',
    errorLink: 'The activation link is invalid or has expired.',
    success: (name: string) => `Welcome, ${name}! Redirecting...`,
    successManual: 'Password set! Redirecting to login...',
  },
} as const;

export default function SetPasswordForm({
  lang = 'es',
  uid,
  timestamp,
  hash,
}: Props) {
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.es;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  function isValidPassword(value: string): boolean {
    if (value.length < 8) return false;
    if (!/[a-zA-Z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!password || !confirm) {
      setAlert({ type: 'error', message: t.errorEmpty });
      return;
    }
    if (password !== confirm) {
      setAlert({ type: 'error', message: t.errorPasswordMismatch });
      return;
    }
    if (!isValidPassword(password)) {
      setAlert({ type: 'error', message: t.errorPasswordWeak });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, timestamp, hash, password }),
      });

      const status = res.status;
      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        if (data.requiresLogin) {
          setAlert({ type: 'success', message: t.successManual });
          setTimeout(() => { window.location.assign(`/${lang}/login`); }, 2000);
        } else {
          setAlert({ type: 'success', message: t.success(data.user.name) });
          setTimeout(() => { window.location.assign(`/${lang}/dashboard`); }, 1200);
        }
      } else {
        const isLinkError = status === 400 || status === 403 || status === 410;
        setAlert({
          type: 'error',
          message: isLinkError ? t.errorLink : (data.error ?? t.errorServer),
        });
      }
    } catch {
      setAlert({ type: 'error', message: t.errorServer });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel">
      <div className="form-header">
        <h2 className="form-title">{t.title}</h2>
        <p className="form-subtitle">{t.subtitle}</p>
      </div>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <InputField
          id="password"
          label={t.passwordLabel}
          type="password"
          placeholder={t.passwordPlaceholder}
          icon="lock"
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        <InputField
          id="confirm"
          label={t.confirmLabel}
          type="password"
          placeholder={t.confirmPlaceholder}
          icon="check"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />

        <button
          type="submit"
          disabled={loading}
          className={`submit-btn${loading ? ' loading' : ''}`}
        >
          {loading ? <span className="btn-spinner" /> : t.submitButton}
        </button>
      </form>

      <p className="login-hint">
        <a href={`/${lang}/login`} className="login-link">
          {lang === 'es' ? 'Volver al login' : 'Back to login'}
        </a>
      </p>

      <style>{`
        .form-panel { width: 100%; max-width: 480px; }

        .form-header { text-align: center; margin-bottom: 2rem; }
        .form-title {
          font-size: 1.875rem; font-weight: 800;
          letter-spacing: -0.03em; color: var(--text-main); margin-bottom: 0.375rem;
        }
        .form-subtitle { color: var(--text-muted); font-size: 0.9375rem; }

        .register-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }

        .submit-btn {
          margin-top: 0.75rem; width: 100%; height: 3rem;
          background: var(--primary); color: white; border: none;
          border-radius: 0.5rem; font-family: inherit;
          font-size: 0.9375rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--primary-dark);
          box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 45%, transparent);
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-spinner {
          width: 1.125rem; height: 1.125rem;
          border: 2.5px solid rgba(255 255 255 / 0.35);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .login-hint {
          margin-top: 2rem; text-align: center;
          font-size: 0.875rem; color: var(--text-muted);
        }
        .login-link {
          font-weight: 700; color: var(--primary);
          text-decoration: none; transition: color 0.2s;
        }
        .login-link:hover { color: var(--primary-dark); text-decoration: underline; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
