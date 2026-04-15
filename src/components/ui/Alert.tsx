type AlertType = 'error' | 'success' | 'info';

interface AlertProps {
  type?: AlertType;
  message: string | null; // null = oculto
}

const icons: Record<AlertType, string> = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
};

export default function Alert({ type = 'error', message }: AlertProps) {
  if (!message) return null;

  return (
    <div role="alert" aria-live="polite" className={`alert alert--${type}`}>
      <span className="material-symbols-outlined alert-icon">{icons[type]}</span>
      <span>{message}</span>

      <style>{`
        .alert {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.75rem 1rem; border-radius: 0.5rem;
          font-size: 0.875rem; font-weight: 500;
          animation: fadeIn 0.2s ease;
        }
        .alert--error {
          background: color-mix(in srgb, var(--primary) 12%, transparent);
          color: #c0304a;
          border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
        }
        .alert--success {
          background: color-mix(in srgb, #22c55e 12%, transparent);
          color: #15803d;
          border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
        }
        .alert-icon { font-size: 1.25rem; flex-shrink: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}