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
    </div>
  );
}