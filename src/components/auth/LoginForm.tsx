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
    <div className="w-full max-w-[480px]">
      <div className="text-center mb-8">
        <h2 className="text-[1.875rem] font-extrabold tracking-tight text-text-main mb-1.5">
          Bienvenido de nuevo
        </h2>
        <p className="text-text-muted text-[0.9375rem]">
          Ingresa tus datos para continuar aprendiendo.
        </p>
      </div>

      {/* Tabs */}
      <nav className="flex border-b border-border mb-6">
        <a 
          href="/login" 
          className="flex-1 pb-3 text-center border-b-[3px] border-primary font-bold text-sm text-primary transition-colors"
        >
          Iniciar Sesión
        </a>
        <a 
          href="/register" 
          className="flex-1 pb-3 text-center border-b-[3px] border-transparent font-bold text-sm text-text-muted hover:text-text-main transition-colors"
        >
          Registrarme
        </a>
      </nav>

      <Alert type={alert?.type ?? 'error'} message={alert?.message ?? null} />

      <form className="flex flex-col gap-5 mt-6" onSubmit={handleSubmit} noValidate>
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

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted hover:text-text-main transition-colors">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span>Recordarme</span>
          </label>
          <a 
            href="/forgot-password" 
            className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
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
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        ¿Aún no tienes una cuenta?{' '}
        <a 
          href="/register" 
          className="font-bold text-primary hover:text-primary-dark hover:underline transition-colors"
        >
          Regístrate aquí
        </a>
      </p>
    </div>
  );
}