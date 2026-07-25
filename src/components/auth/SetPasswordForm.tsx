import { useState, useEffect } from 'react';
import InputField from '@/components/ui/InputField';
import Alert from '@/components/ui/Alert';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';
import { isValidPassword } from '@/utils/passwordValidation';
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
    validating: 'Verificando enlace...',
    titleReset: 'Restablecer contraseña',
    subtitleReset: 'Elige una contraseña nueva para acceder a tu cuenta.',
    titleActivate: 'Activar tu cuenta',
    subtitleActivate: 'Establece una contraseña para acceder a tu nueva cuenta.',
    passwordLabel: 'Nueva contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres',
    confirmLabel: 'Confirmar contraseña',
    confirmPlaceholder: 'Repite tu contraseña',
    submitReset: 'Restablecer contraseña',
    submitActivate: 'Activar cuenta',
    errorEmpty: 'Completa todos los campos para continuar.',
    errorPasswordMismatch: 'Las contraseñas no coinciden.',
    errorPasswordWeak: 'Usa al menos 8 caracteres e incluye una letra y un número.',
    errorServer: 'No pudimos conectar con el servidor. Intenta otra vez.',
    linkExpired: 'El enlace ya expiró o ya fue usado.',
    linkExpiredDesc: 'Solicita un nuevo enlace de recuperación para continuar.',
    linkExpiredCta: 'Solicitar nuevo enlace',
    linkInvalidUser: 'El usuario no es válido o está bloqueado.',
    linkInvalidUserDesc: 'Contacta con soporte si crees que esto es un error.',
    success: (name: string) => `¡Bienvenido, ${name}! Redirigiendo...`,
    successManual: '¡Contraseña restablecida! Redirigiendo al login...',
    backToLogin: 'Volver al inicio de sesión',
  },
  en: {
    validating: 'Verifying link...',
    titleReset: 'Reset your password',
    subtitleReset: 'Choose a new password to access your account.',
    titleActivate: 'Activate your account',
    subtitleActivate: 'Set a password to access your new account.',
    passwordLabel: 'New password',
    passwordPlaceholder: 'At least 8 characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Repeat your password',
    submitReset: 'Reset password',
    submitActivate: 'Activate account',
    errorEmpty: 'Please fill in all fields to continue.',
    errorPasswordMismatch: 'Passwords do not match.',
    errorPasswordWeak: 'Use at least 8 characters with a letter and a number.',
    errorServer: 'Could not connect to server. Try again.',
    linkExpired: 'The link has expired or was already used.',
    linkExpiredDesc: 'Request a new recovery link to continue.',
    linkExpiredCta: 'Request new link',
    linkInvalidUser: 'The user is invalid or blocked.',
    linkInvalidUserDesc: 'Contact support if you believe this is an error.',
    success: (name: string) => `Welcome, ${name}! Redirecting...`,
    successManual: 'Password reset! Redirecting to login...',
    backToLogin: 'Back to sign in',
  },
} as const;

export default function SetPasswordForm({
  lang = 'es',
  uid,
  timestamp,
  hash,
}: Props) {
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.es;

  const [step, setStep] = useState<'validating' | 'invalid' | 'form'>('validating');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    fetch(`/api/auth/validate-reset-link?uid=${encodeURIComponent(uid)}&timestamp=${encodeURIComponent(timestamp)}&hash=${encodeURIComponent(hash)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setStep('form');
        } else {
          setStep('invalid');
          setErrorMsg(data.error ?? '');
        }
      })
      .catch(() => {
        setStep('invalid');
        setErrorMsg('');
      });
  }, [uid, timestamp, hash]);

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
          message: isLinkError ? t.linkExpired : (data.error ?? t.errorServer),
        });
      }
    } catch {
      setAlert({ type: 'error', message: t.errorServer });
    } finally {
      setLoading(false);
    }
  }

  // ── Link validation state ──────────────────────────────────────────
  if (step === 'validating') {
    return (
      <div className="form-panel">
        <div className="verify-spinner-wrap">
          <span className="verify-spinner" />
          <p className="verify-text">{t.validating}</p>
        </div>
        <style>{`
          .form-panel { width: 100%; max-width: 480px; }
          .verify-spinner-wrap {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 4rem 0; gap: 1.25rem;
          }
          .verify-spinner {
            width: 2.5rem; height: 2.5rem;
            border: 3px solid var(--border); border-top-color: var(--primary);
            border-radius: 50%; animation: spin 0.7s linear infinite;
          }
          .verify-text {
            font-size: 0.9375rem; color: var(--text-muted); text-align: center;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── Invalid/expired link state ─────────────────────────────────────
  if (step === 'invalid') {
    const isBlockedUser = errorMsg?.toLowerCase().includes('blocked');
    return (
      <div className="form-panel">
        <div className="invalid-icon-wrap">
          <span className="material-symbols-outlined invalid-icon">link_off</span>
        </div>
        <h2 className="invalid-title">{t.linkExpired}</h2>
        <p className="invalid-desc">
          {isBlockedUser ? t.linkInvalidUserDesc : t.linkExpiredDesc}
        </p>
        <a href={`/${lang}/forgot-password`} className="submit-btn">
          {t.linkExpiredCta}
        </a>
        <p className="login-hint">
          <a href={`/${lang}/login`} className="login-link">
            {t.backToLogin}
          </a>
        </p>
        <style>{`
          .form-panel { width: 100%; max-width: 480px; text-align: center; }
          .invalid-icon-wrap { margin: 2.5rem 0 1.5rem; }
          .invalid-icon { font-size: 4rem; color: var(--primary); opacity: 0.6; }
          .invalid-title {
            font-size: 1.5rem; font-weight: 800;
            letter-spacing: -0.02em; color: var(--text-main); margin-bottom: 0.75rem;
          }
          .invalid-desc {
            color: var(--text-muted); font-size: 0.9375rem;
            margin-bottom: 2rem; line-height: 1.5;
          }
          .submit-btn {
            display: inline-flex; align-items: center; justify-content: center;
            width: 100%; height: 3rem;
            background: var(--primary); color: white; border: none;
            border-radius: 0.5rem; font-family: inherit;
            font-size: 0.9375rem; font-weight: 700; cursor: pointer;
            text-decoration: none;
            box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
            transition: background 0.2s, transform 0.1s;
          }
          .submit-btn:hover { background: var(--primary-dark); transform: scale(1.01); }
          .login-hint {
            margin-top: 2rem; font-size: 0.875rem; color: var(--text-muted);
          }
          .login-link {
            font-weight: 700; color: var(--primary);
            text-decoration: none;
          }
          .login-link:hover { color: var(--primary-dark); text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  // ── Password form state ────────────────────────────────────────────
  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-icon-wrap">
          <span className="material-symbols-outlined form-icon">lock_reset</span>
        </div>
        <h2 className="form-title">{t.titleReset}</h2>
        <p className="form-subtitle">{t.subtitleReset}</p>
      </div>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="reset-form" onSubmit={handleSubmit} noValidate>
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

        <PasswordStrengthBar value={password} lang={lang} />

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

        {password && confirm && password === confirm && (
          <div className="match-indicator">
            <span className="material-symbols-outlined match-icon">check_circle</span>
            <span className="match-text">
              {lang === 'es' ? 'Las contraseñas coinciden' : 'Passwords match'}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`submit-btn${loading ? ' loading' : ''}`}
        >
          {loading ? <span className="btn-spinner" /> : t.submitReset}
        </button>
      </form>

      <p className="login-hint">
        <a href={`/${lang}/login`} className="login-link">
          {t.backToLogin}
        </a>
      </p>

      <style>{`
        .form-panel { width: 100%; max-width: 480px; }

        .form-header { text-align: center; margin-bottom: 2rem; }
        .form-icon-wrap {
          display: flex; justify-content: center; margin-bottom: 1rem;
        }
        .form-icon {
          font-size: 3.25rem; color: var(--primary); opacity: 0.7;
        }
        .form-title {
          font-size: 1.75rem; font-weight: 800;
          letter-spacing: -0.03em; color: var(--text-main); margin-bottom: 0.375rem;
        }
        .form-subtitle { color: var(--text-muted); font-size: 0.9375rem; }

        .reset-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }

        .match-indicator {
          display: flex; align-items: center; gap: 0.375rem; padding: 0 0.25rem;
        }
        .match-icon { font-size: 1.125rem; color: #16a34a; }
        .match-text { font-size: 0.8125rem; font-weight: 600; color: #16a34a; }

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
