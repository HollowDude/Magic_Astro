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
}

export default function RegisterForm({ lang = 'es' }: Props) {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState<AlertState | null>(null);

  function friendlyRegisterError(status: number, message?: string): string {
    if (status === 400) return 'Revisa los datos e intenta de nuevo.';
    if (status === 409) return 'Ese usuario o correo ya existe.';
    if (status === 503) return 'No pudimos conectar con el servidor. Intenta otra vez.';
    if (message && message.length < 140 && !/json|token|exception|stack|trace|sql/i.test(message)) {
      return message;
    }
    return 'Ocurrio un problema. Intenta mas tarde.';
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

    // Validaciones del lado del cliente
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setAlert({ type: 'error', message: 'Completa todos los campos para continuar.' });
      return;
    }
    if (password !== confirm) {
      setAlert({ type: 'error', message: 'Las contrasenas no coinciden.' });
      return;
    }
    if (!isValidPassword(password)) {
      setAlert({ type: 'error', message: 'Usa al menos 8 caracteres e incluye una letra y un numero.' });
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
          message: `¡Cuenta creada! Bienvenido, ${data.user.name}. Redirigiendo al login…`,
        });
        setTimeout(() => { window.location.href = `/${lang}/login`; }, 1800);
      } else {
        setAlert({ type: 'error', message: friendlyRegisterError(status, data.error) });
      }
    } catch {
      setAlert({ type: 'error', message: 'No pudimos conectar con el servidor. Intenta otra vez.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel">
      <div className="form-header">
        <h2 className="form-title">Crear una cuenta</h2>
        <p className="form-subtitle">Completá tus datos para empezar a aprender.</p>
      </div>

      {/* Tabs */}
      <nav className="auth-tabs">
        <a href={`/${lang}/login`}    className="auth-tab">Iniciar Sesión</a>
        <a href={`/${lang}/register`} className="auth-tab auth-tab--active">Registrarme</a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <InputField
          id="username"
          label="Nombre de usuario"
          type="text"
          placeholder="Tu usuario"
          icon="person"
          required
          autoComplete="username"
          value={username}
          onChange={setUsername}
        />

        <InputField
          id="email"
          label="Correo electronico"
          type="email"
          placeholder="tu@correo.com"
          icon="mail"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />

        <InputField
          id="password"
          label="Contraseña"
          type="password"
          placeholder="Minimo 8 caracteres"
          icon="lock"
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        <InputField
          id="confirm"
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite tu contraseña"
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
          {loading ? <span className="btn-spinner" /> : 'Crear cuenta'}
        </button>
      </form>

      <p className="login-hint">
        ¿Ya tenés una cuenta?{' '}
        <a href={`/${lang}/login`} className="login-link">Iniciá sesión aquí</a>
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