// src/components/auth/ForgotPasswordForm.tsx
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
  formParentId?: string | number | null;
}

const TRANSLATIONS = {
  es: {
    title: '¿Olvidaste tu contraseña?',
    subtitle: 'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
    tabLogin: 'Iniciar Sesión',
    tabRegister: 'Registrarme',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    submitButton: 'Enviar enlace',
    backToLogin: 'Volver al inicio de sesión',
    errorEmpty: 'Ingresa tu correo electrónico para continuar.',
    errorNotFound: 'No encontramos una cuenta con este correo electrónico.',
    errorServer: 'No pudimos conectar con el servidor. Intenta otra vez.',
    successTitle: '¡Correo enviado!',
    successDesc: 'Revisa tu bandeja de entrada, te enviamos un enlace para restablecer tu contraseña.',
  },
  en: {
    title: 'Forgot your password?',
    subtitle: 'Enter your email and we\'ll send you a link to reset it.',
    tabLogin: 'Sign In',
    tabRegister: 'Register',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    submitButton: 'Send link',
    backToLogin: 'Back to sign in',
    errorEmpty: 'Please enter your email to continue.',
    errorNotFound: 'No account found with this email address.',
    errorServer: 'Could not connect to server. Try again.',
    successTitle: 'Email sent!',
    successDesc: 'Check your inbox, we sent you a link to reset your password.',
  },
} as const;

export default function ForgotPasswordForm({
  lang = 'es',
  formTitle,
  formSubtitle,
  formParagraphId,
  formParagraphInternalId,
  formParentId,
}: Props) {
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.es;
  const displayTitle = formTitle ?? t.title;
  const displaySubtitle = formSubtitle ?? t.subtitle;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!email.trim()) {
      setAlert({ type: 'error', message: t.errorEmpty });
      return;
    }

    setLoading(true);
    try {
      const checkRes = await fetch(`/api/auth/check-email?mail=${encodeURIComponent(email.trim())}`);
      const checkData = await checkRes.json().catch(() => ({}));

      if (!checkData.exists) {
        setAlert({ type: 'error', message: t.errorNotFound });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        setSent(true);
      } else {
        setAlert({ type: 'error', message: data.error ?? t.errorServer });
      }
    } catch {
      setAlert({ type: 'error', message: t.errorServer });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="form-panel">
        <div className="form-header">
          <h2 className="form-title">{t.successTitle}</h2>
          <p className="form-subtitle">{t.successDesc}</p>
        </div>

        <div className="success-icon-wrap">
          <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
        </div>

        <a href={`/${lang}/login`} className="submit-btn back-btn">
          {t.backToLogin}
        </a>

        <style>{`
          .form-panel { width: 100%; max-width: 480px; text-align: center; }
          .form-header { text-align: center; margin-bottom: 2rem; }
          .form-title {
            font-size: 1.875rem; font-weight: 800;
            letter-spacing: -0.03em; color: var(--text-main); margin-bottom: 0.375rem;
          }
          .form-subtitle { color: var(--text-muted); font-size: 0.9375rem; }
          .success-icon-wrap { margin: 2rem 0; }
          .back-btn {
            display: inline-flex; align-items: center; justify-content: center;
            width: 100%; height: 3rem; background: var(--primary); color: white;
            border: none; border-radius: 0.5rem; font-family: inherit;
            font-size: 0.9375rem; font-weight: 700; cursor: pointer;
            text-decoration: none; box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
            transition: background 0.2s, transform 0.1s;
          }
          .back-btn:hover { background: var(--primary-dark); transform: scale(1.01); }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="form-panel"
      data-nodehive-entity-type={formParagraphId ? 'paragraph' : undefined}
      data-nodehive-entity-id={formParagraphId ?? undefined}
      data-nodehive-entity-internal-id={formParagraphInternalId ?? undefined}
      data-nodehive-parent_id={formParentId ?? undefined}
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
        <a href={`/${lang}/login`} className="auth-tab">{t.tabLogin}</a>
        <a href={`/${lang}/register`} className="auth-tab">{t.tabRegister}</a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="register-form" onSubmit={handleSubmit} noValidate>
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

        <button
          type="submit"
          disabled={loading}
          className={`submit-btn${loading ? ' loading' : ''}`}
        >
          {loading ? <span className="btn-spinner" /> : t.submitButton}
        </button>
      </form>

      <p className="login-hint">
        <a href={`/${lang}/login`} className="login-link">{t.backToLogin}</a>
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
