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
    <div role="alert" aria-live="polite" className={`alert alert-${type}`}>
      <span className="material-symbols-outlined text-xl shrink-0">
        {icons[type]}
      </span>
      <span>{message}</span>
    </div>
  );
}