// src/components/auth/RegisterForm.tsx
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
  formTitle?: string | null;
  formSubtitle?: string | null;
  formParagraphId?: string | null;
  formParagraphInternalId?: number | null;
}

const TRANSLATIONS = {
  es: {
    title: 'Crear una cuenta',
    subtitle: 'Completá tus datos para empezar a aprender.',
    tabLogin: 'Iniciar Sesión',
    tabRegister: 'Registrarme',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'Tu usuario',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres',
    confirmLabel: 'Confirmar contraseña',
    confirmPlaceholder: 'Repite tu contraseña',
    submitButton: 'Crear cuenta',
    hasAccount: '¿Ya tenés una cuenta?',
    loginHere: 'Iniciá sesión aquí',
    errorEmpty: 'Completa todos los campos para continuar.',
    errorPasswordMismatch: 'Las contraseñas no coinciden.',
    errorPasswordWeak: 'Usa al menos 8 caracteres e incluye una letra y un número.',
    errorServer: 'No pudimos conectar con el servidor. Intenta otra vez.',
    success: (name: string) => `¡Cuenta creada! Bienvenido, ${name}. Redirigiendo al login…`,
  },
  en: {
    title: 'Create your account',
    subtitle: 'Fill in your details to start learning.',
    tabLogin: 'Sign In',
    tabRegister: 'Register',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Your username',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Repeat your password',
    submitButton: 'Create account',
    hasAccount: 'Already have an account?',
    loginHere: 'Sign in here',
    errorEmpty: 'Please fill in all fields to continue.',
    errorPasswordMismatch: 'Passwords do not match.',
    errorPasswordWeak: 'Use at least 8 characters with a letter and a number.',
    errorServer: 'Could not connect to server. Try again.',
    success: (name: string) => `Account created! Welcome, ${name}. Redirecting to login…`,
  },
} as const;

export default function RegisterForm({
  lang = 'es',
  formTitle,
  formSubtitle,
  formParagraphId,
  formParagraphInternalId,
}: Props) {
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.es;
  const displayTitle = formTitle ?? t.title;
  const displaySubtitle = formSubtitle ?? t.subtitle;
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState<AlertState | null>(null);

  function friendlyRegisterError(status: number, message?: string): string {
    if (status === 400) return t.errorEmpty;
    if (status === 409) return lang === 'es' ? 'Ese usuario o correo ya existe.' : 'Username or email already exists.';
    if (status === 503) return t.errorServer;
    if (message && message.length < 140 && !/json|token|exception|stack|trace|sql/i.test(message)) {
      return message;
    }
    return lang === 'es' ? 'Ocurrió un problema. Intenta más tarde.' : 'Something went wrong. Try again later.';
  }

  function isValidPassword(value: string): boolean {
    if (value.length < 8) return false;
    if (!/[a-zA-Z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!username.trim() || !email.trim() || !password || !confirm) {
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
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: username.trim(),
          email:    email.trim(),
          password,
        }),
      });

      const status = res.status;
      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        setAlert({
          type:    'success',
          message: t.success(data.user.name),
        });
        setTimeout(() => { window.location.href = `/${lang}/login`; }, 1800);
      } else {
        setAlert({ type: 'error', message: friendlyRegisterError(status, data.error) });
      }
    } catch {
      setAlert({ type: 'error', message: t.errorServer });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="form-panel"
      data-nodehive-entity-type={formParagraphId ? 'paragraph' : undefined}
      data-nodehive-entity-id={formParagraphId ?? undefined}
      data-nodehive-entity-internal-id={formParagraphInternalId ?? undefined}
    >
      <div className="form-header">
        <h2
          className="form-title"
          data-nodehive-field={formParagraphId ? 'field_title' : undefined}
        >
          {displayTitle}
        </h2>
        <p
          className="form-subtitle"
          data-nodehive-field={formParagraphId ? 'field_subtitle' : undefined}
        >
          {displaySubtitle}
        </p>
      </div>

      {/* Tabs */}
      <nav className="auth-tabs">
        <a href={`/${lang}/login`}    className="auth-tab">{t.tabLogin}</a>
        <a href={`/${lang}/register`} className="auth-tab auth-tab--active">{t.tabRegister}</a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <InputField
          id="username"
          label={t.usernameLabel}
          type="text"
          placeholder={t.usernamePlaceholder}
          icon="person"
          required
          autoComplete="username"
          value={username}
          onChange={setUsername}
        />

        <InputField
          id="email"
          label={t.emailLabel}
          type="email"
          placeholder={t.emailPlaceholder}
          icon="mail"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />

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
        {t.hasAccount}{' '}
        <a href={`/${lang}/login`} className="login-link">{t.loginHere}</a>
      </p>

      <style>{`
        .form-panel { width: 100%; max-width: 480px; }

        .form-header { text-align: center; margin-bottom: 2rem; }
        .form-title {
          font-size: 1.875rem; font-weight: 800;
          letter-spacing: -0.03em; color: var(--text-main); margin-bottom: 0.375rem;
        }
        .form-subtitle { color: var(--text-muted); font-size: 0.9375rem; }

        .auth-tabs {
          display: flex; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;
        }
        .auth-tab {
          flex: 1; padding-bottom: 0.75rem; text-align: center;
          border-bottom: 3px solid transparent; font-weight: 700;
          font-size: 0.875rem; color: var(--text-muted);
          text-decoration: none; transition: color 0.2s, border-color 0.2s;
        }
        .auth-tab:hover { color: var(--text-main); }
        .auth-tab--active { color: var(--primary); border-bottom-color: var(--primary); }

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