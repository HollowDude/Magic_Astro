import { useState } from 'react';

interface InputFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  icon: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function InputField({
  id,
  label,
  type = 'text',
  placeholder = '',
  icon,
  required = false,
  autoComplete,
  value,
  onChange,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="field-wrapper">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="field-inner">
        <span className="material-symbols-outlined field-icon">{icon}</span>
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
        />
        {type === 'password' && (
          <button
            type="button"
            className="toggle-pass"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShowPassword((v) => !v)}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        )}
      </div>

      <style>{`
        .field-wrapper { display: flex; flex-direction: column; gap: 0.5rem; }
        .field-label { font-size: 0.875rem; font-weight: 600; color: var(--text-main); }
        .field-inner { position: relative; }
        .field-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); font-size: 1.25rem; pointer-events: none;
        }
        .field-input {
          width: 100%; height: 3rem; border-radius: 0.5rem;
          border: 1px solid var(--border); background: var(--bg-light);
          padding-left: 2.75rem; padding-right: 2.75rem;
          font-size: 0.875rem; color: var(--text-main); font-family: inherit;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
        }
        .toggle-pass {
          position: absolute; right: 0.75rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 0.25rem;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .toggle-pass:hover { color: var(--text-main); }
        .toggle-pass .material-symbols-outlined { font-size: 1.25rem; }
      `}</style>
    </div>
  );
}
