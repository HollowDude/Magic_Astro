import { useState } from 'react';

interface Props {
  label: string;
  currentValue: string;
  icon: string;
  type?: 'text' | 'email';
  saving: boolean;
  editLabel?: string;
  cancelLabel?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  onSave: (newValue: string, password: string) => Promise<void>;
  onCancel?: () => void;
}

export default function EditableField({
  label,
  currentValue,
  icon,
  type = 'text',
  saving,
  editLabel = 'Editar',
  cancelLabel = 'Cancelar',
  passwordLabel = 'Confirma tu contraseña',
  passwordPlaceholder = 'Tu contraseña actual',
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="ef-field ef-readonly">
        <div className="ef-read-left">
          <span className="material-symbols-outlined ef-icon">{icon}</span>
          <div>
            <p className="ef-label">{label}</p>
            <p className="ef-value">{currentValue}</p>
          </div>
        </div>
        <button
          type="button"
          className="ef-edit-btn"
          onClick={() => { setValue(currentValue); setPassword(''); setEditing(true); }}
        >
          {editLabel}
        </button>

        <style>{`
          .ef-field { padding: 1rem 0; }
          .ef-readonly {
            display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          }
          .ef-read-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
          .ef-icon { font-size: 1.5rem; color: var(--primary); opacity: 0.6; flex-shrink: 0; }
          .ef-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
          .ef-value { font-size: 0.9375rem; font-weight: 600; color: var(--text-main); word-break: break-all; }
          .ef-edit-btn {
            flex-shrink: 0; font-size: 0.8125rem; font-weight: 700; color: var(--primary);
            background: none; border: none; cursor: pointer; white-space: nowrap;
            padding: 0.375rem 0.75rem; border-radius: 0.375rem;
            transition: background 0.15s;
          }
          .ef-edit-btn:hover { background: var(--blush); }
        `}</style>
      </div>
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    try {
      await onSave(value, password);
      setSuccess('Guardado');
      setTimeout(() => { setEditing(false); setSuccess(null); setPassword(''); }, 1500);
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar');
    }
  }

  function handleCancel() {
    setEditing(false);
    setValue(currentValue);
    setPassword('');
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="ef-field ef-editing">
      <div className="ef-edit-header">
        <span className="material-symbols-outlined ef-icon">{icon}</span>
        <span className="ef-label">{label}</span>
      </div>

      <div className="field-wrapper">
        <div className="field-inner">
          <span className="material-symbols-outlined field-icon">{icon}</span>
          <input
            type={type}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="field-input"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="field-wrapper">
        <div className="field-inner">
          <span className="material-symbols-outlined field-icon">lock</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="field-input"
            required
            placeholder={passwordPlaceholder}
          />
        </div>
        <p className="ef-pw-hint">{passwordLabel}</p>
      </div>

      {error && <p className="ef-error">{error}</p>}
      {success && <p className="ef-success">{success}</p>}

      <div className="ef-actions">
        <button
          type="button"
          className="btn-primary ef-btn"
          disabled={saving || !password || !value.trim()}
          onClick={handleSave}
        >
          {saving ? <span className="ef-spinner" /> : 'Guardar'}
        </button>
        <button type="button" className="ef-cancel-btn" onClick={handleCancel}>
          {cancelLabel}
        </button>
      </div>

      <style>{`
        .ef-field { padding: 1rem 0; }
        .ef-editing { display: flex; flex-direction: column; gap: 0.75rem; }
        .ef-edit-header { display: flex; align-items: center; gap: 0.5rem; }
        .ef-edit-header .ef-icon { font-size: 1.25rem; color: var(--primary); opacity: 0.6; }
        .ef-edit-header .ef-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .ef-pw-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
        .ef-error { font-size: 0.8125rem; color: #dc2626; font-weight: 500; }
        .ef-success { font-size: 0.8125rem; color: #16a34a; font-weight: 600; }
        .ef-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem; }
        .ef-btn { height: 2.5rem !important; padding-inline: 1.25rem !important; font-size: 0.875rem !important; }
        .ef-cancel-btn {
          font-size: 0.8125rem; font-weight: 600; color: var(--text-muted);
          background: none; border: none; cursor: pointer; padding: 0.375rem 0.75rem;
          border-radius: 0.375rem; transition: background 0.15s;
        }
        .ef-cancel-btn:hover { background: var(--blush); color: var(--primary); }
        .ef-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255 255 255 / 0.35);
          border-top-color: white; border-radius: 50%;
          animation: ef-spin 0.7s linear infinite;
        }
        @keyframes ef-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
