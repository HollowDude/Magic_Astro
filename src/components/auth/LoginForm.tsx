import { useState, useEffect } from 'react';
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
    title: 'Bienvenido de nuevo',
    subtitle: 'Ingresa tus datos para continuar aprendiendo.',
    tabLogin: 'Iniciar Sesión',
    tabRegister: 'Registrarme',
    usernameLabel: 'Usuario o correo electrónico',
    usernamePlaceholder: 'Tu usuario o correo',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingresa tu contraseña',
    rememberMe: 'Recordarme',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submitButton: 'Iniciar Sesión',
    noAccount: '¿Aún no tienes una cuenta?',
    registerHere: 'Regístrate aquí',
    errorExpired: 'Tu sesión expiró. Inicia sesión de nuevo.',
    errorEmpty: 'Completa usuario y contraseña para continuar.',
    errorServer: 'No pudimos conectar con el servidor. Intenta otra vez.',
    success: (name: string) => `¡Bienvenido, ${name}!`,
  },
  en: {
    title: 'Welcome back',
    subtitle: 'Enter your details to continue learning.',
    tabLogin: 'Sign In',
    tabRegister: 'Register',
    usernameLabel: 'Username or email',
    usernamePlaceholder: 'Your username or email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot your password?',
    submitButton: 'Sign In',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    errorExpired: 'Your session expired. Please sign in again.',
    errorEmpty: 'Please enter username and password to continue.',
    errorServer: 'Could not connect to server. Try again.',
    success: (name: string) => `Welcome, ${name}!`,
  },
} as const;

export default function LoginForm({
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const redirectUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect')
    : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).has('expired')) {
      setAlert({ type: 'error', message: t.errorExpired });
    }
  }, [t.errorExpired]);

  function friendlyLoginError(status: number, message?: string): string {
    const msg = (message ?? '').toLowerCase();
    if (status === 401 || status === 403) return lang === 'es' ? 'Usuario o contraseña incorrectos.' : 'Invalid username or password.';
    if (status === 503) return t.errorServer;
    if (msg.includes('required') || msg.includes('requerido') || msg.includes('completa')) return t.errorEmpty;
    if (msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('incorrect') || msg.includes('invalid') || msg.includes('credencial') || msg.includes('contraseña') || msg.includes('password')) return lang === 'es' ? 'Usuario o contraseña incorrectos.' : 'Invalid username or password.';
    if (message && message.length < 120 && !/json|token|exception|stack|trace|sql/i.test(message)) {
      return message;
    }
    return lang === 'es' ? 'Ocurrió un problema. Intenta más tarde.' : 'Something went wrong. Try again later.';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!username.trim() || !password) {
      setAlert({ type: 'error', message: t.errorEmpty });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const status = res.status;
      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        setAlert({ type: 'success', message: t.success(data.user.name) });
        const target = redirectUrl || `/${lang}/dashboard`;
        setTimeout(() => { window.location.assign(target); }, 600);
      } else {
        setAlert({ type: 'error', message: friendlyLoginError(status, data.error) });
      }
    } catch {
      setAlert({ type: 'error', message: t.errorServer });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full max-w-[480px]"
      data-nodehive-entity-type={formParagraphId ? 'paragraph' : undefined}
      data-nodehive-entity-id={formParagraphId ?? undefined}
      data-nodehive-entity-internal-id={formParagraphInternalId ?? undefined}
      data-nodehive-parent_id={formParentId ?? undefined}
    >
      <div className="text-center mb-8">
        <h2
          className="text-[1.875rem] font-extrabold tracking-tight text-text-main mb-1.5"
          data-nodehive-field={formParagraphId ? 'field_title' : undefined}
        >
          {displayTitle}
        </h2>
        <p
          className="text-text-muted text-[0.9375rem]"
          data-nodehive-field={formParagraphId ? 'field_subtitle' : undefined}
        >
          {displaySubtitle}
        </p>
      </div>

      {/* Tabs */}
      <nav className="flex border-b border-border mb-6">
        <a
          href={`/${lang}/login`}
          className="flex-1 pb-3 text-center border-b-[3px] border-primary font-bold text-sm text-primary transition-colors"
        >
          {t.tabLogin}
        </a>
        <a
          href={`/${lang}/register`}
          className="flex-1 pb-3 text-center border-b-[3px] border-transparent font-bold text-sm text-text-muted hover:text-text-main transition-colors"
        >
          {t.tabRegister}
        </a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="flex flex-col gap-5 mt-6" onSubmit={handleSubmit} noValidate>
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
          id="password"
          label={t.passwordLabel}
          type="password"
          placeholder={t.passwordPlaceholder}
          icon="lock"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted hover:text-text-main transition-colors">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span>{t.rememberMe}</span>
          </label>
          <a
            href={`/${lang}/forgot-password`}
            className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
          >
            {t.forgotPassword}
          </a>
        </div>

        {/* Reutilizando tu clase global .btn-primary y ajustando ancho/alto con Tailwind */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-3 h-12"
        >
          {loading ? (
            <span className="w-[1.125rem] h-[1.125rem] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin" />
          ) : (
            t.submitButton
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        {t.noAccount}{' '}
        <a
          href={`/${lang}/register`}
          className="font-bold text-primary hover:text-primary-dark hover:underline transition-colors"
        >
          {t.registerHere}
        </a>
      </p>
    </div>
  );
}