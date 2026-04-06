import { useState } from 'react';
import InputField from '@/components/ui/InputField';
import Alert from '@/components/ui/Alert';

type AlertType = 'error' | 'success';

interface AlertState {
  type: AlertType;
  message: string;
}

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!username.trim() || !password) {
      setAlert({ type: 'error', message: 'Por favor, completa todos los campos.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (data.ok) {
        setAlert({ type: 'success', message: `¡Bienvenido, ${data.user.name}!` });
        setTimeout(() => { window.location.href = '/dashboard'; }, 600);
      } else {
        setAlert({ type: 'error', message: data.error ?? 'Credenciales incorrectas.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'No se pudo conectar con el servidor.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel">
      <div className="form-header">
        <h2 className="form-title">Bienvenido de nuevo</h2>
        <p className="form-subtitle">Ingresa tus datos para continuar aprendiendo.</p>
      </div>

      {/* Tabs */}
      <nav className="auth-tabs">
        <a href="/login" className="auth-tab auth-tab--active">Iniciar Sesión</a>
        <a href="/register" className="auth-tab">Registrarme</a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <InputField
          id="username"
          label="Usuario o correo electrónico"
          type="text"
          placeholder="tu_usuario"
          icon="person"
          required
          autoComplete="username"
          value={username}
          onChange={setUsername}
        />

        <InputField
          id="password"
          label="Contraseña"
          type="password"
          placeholder="Ingresa tu contraseña"
          icon="lock"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <div className="form-extras">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="remember-checkbox"
            />
            <span>Recordarme</span>
          </label>
          <a href="/forgot-password" className="forgot-link">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" disabled={loading} className={`submit-btn${loading ? ' loading' : ''}`}>
          {loading ? <span className="btn-spinner" /> : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="register-hint">
        ¿Aún no tienes una cuenta?{' '}
        <a href="/register" className="register-link">Regístrate aquí</a>
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

        .login-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }

        .form-extras {
          display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;
        }
        .remember-me {
          display: flex; align-items: center; gap: 0.5rem;
          cursor: pointer; font-size: 0.875rem; color: var(--text-muted);
          transition: color 0.2s;
        }
        .remember-me:hover { color: var(--text-main); }
        .remember-checkbox { width: 1rem; height: 1rem; accent-color: var(--primary); cursor: pointer; }
        .forgot-link {
          font-size: 0.875rem; font-weight: 600; color: var(--primary);
          text-decoration: none; transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--primary-dark); text-decoration: underline; }

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

        .register-hint {
          margin-top: 2rem; text-align: center;
          font-size: 0.875rem; color: var(--text-muted);
        }
        .register-link {
          font-weight: 700; color: var(--primary);
          text-decoration: none; transition: color 0.2s;
        }
        .register-link:hover { color: var(--primary-dark); text-decoration: underline; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
