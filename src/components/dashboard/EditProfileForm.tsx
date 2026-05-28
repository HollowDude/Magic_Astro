import { useState, useRef } from 'react';
import EditableField from '@/components/ui/EditableField';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';
import { isValidPassword } from '@/utils/passwordValidation';

interface Props {
  lang: 'es' | 'en';
  initialName: string;
  initialMail: string;
  initialPicture: string | null;
  userUuid: string;
}

const T = {
  es: {
    title: 'Editar Perfil',
    nameLabel: 'Nombre de usuario',
    mailLabel: 'Correo electrónico',
    passwordTitle: 'Contraseña',
    passwordDesc: 'Protegida',
    changePassword: 'Cambiar contraseña',
    cancelPassword: 'Cancelar',
    newPassword: 'Nueva contraseña',
    newPasswordPlaceholder: 'Mínimo 8 caracteres',
    confirmPassword: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Repite la contraseña',
    currentPassword: 'Contraseña actual',
    currentPasswordPlaceholder: 'Tu contraseña actual',
    currentPasswordHint: 'Necesaria para guardar el cambio',
    save: 'Guardar',
    saving: 'Guardando...',
    edit: 'Editar',
    cancel: 'Cancelar',
    success: 'Perfil actualizado.',
    errorServer: 'No se pudo actualizar.',
    changePhoto: 'Cambiar foto',
    removePhoto: 'Eliminar foto',
    uploadPhoto: 'Subir foto',
    photoSaving: 'Subiendo...',
    photoError: 'Error al subir la foto.',
    photoUpdating: 'Cambiando foto...',
    passwordMatch: 'Las contraseñas coinciden',
    passwordMismatch: 'Las contraseñas no coinciden',
    backToAccount: 'Mi Cuenta',
  },
  en: {
    title: 'Edit Profile',
    nameLabel: 'Username',
    mailLabel: 'Email address',
    passwordTitle: 'Password',
    passwordDesc: 'Protected',
    changePassword: 'Change password',
    cancelPassword: 'Cancel',
    newPassword: 'New password',
    newPasswordPlaceholder: 'At least 8 characters',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Repeat password',
    currentPassword: 'Current password',
    currentPasswordPlaceholder: 'Your current password',
    currentPasswordHint: 'Required to save the change',
    save: 'Save',
    saving: 'Saving...',
    edit: 'Edit',
    cancel: 'Cancel',
    success: 'Profile updated.',
    errorServer: 'Could not update.',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    uploadPhoto: 'Upload photo',
    photoSaving: 'Uploading...',
    photoError: 'Error uploading photo.',
    photoUpdating: 'Updating photo...',
    passwordMatch: 'Passwords match',
    passwordMismatch: 'Passwords do not match',
    backToAccount: 'My Account',
  },
};

export default function EditProfileForm({ lang, initialName, initialMail, initialPicture, userUuid }: Props) {
  const t = T[lang];

  // Name / mail
  const [nameSaving, setNameSaving] = useState(false);

  // Password section
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Photo
  const [picture, setPicture] = useState<string | null>(initialPicture);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global feedback
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  async function saveName(newValue: string, password: string) {
    setNameSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newValue.trim(),
          userUuid,
          currentPassword: password,
          lang,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? t.errorServer);
    } finally {
      setNameSaving(false);
    }
  }

  async function saveMail(newValue: string, password: string) {
    setNameSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mail: newValue.trim(),
          userUuid,
          currentPassword: password,
          lang,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? t.errorServer);
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave() {
    if (!newPassword || !confirmPw || !currentPassword) return;
    if (newPassword !== confirmPw) return;
    if (!isValidPassword(newPassword)) return;

    setPasswordSaving(true);
    setGlobalSuccess(null);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUuid,
          currentPassword,
          newPassword,
          lang,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? t.errorServer);
      setGlobalSuccess(t.success);
      setShowPasswordSection(false);
      setNewPassword('');
      setConfirmPw('');
      setCurrentPassword('');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/user/update-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: file.name,
          mimeType: file.type,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPicture(data.url);
        setGlobalSuccess(t.success);
      } else {
        setUploadError(data.error ?? t.photoError);
      }
    } catch {
      setUploadError(t.photoError);
    } finally {
      setUploading(false);
    }
  }

  const passwordsMatch = newPassword && confirmPw && newPassword === confirmPw;

  return (
    <div className="ep-page">
      {/* Breadcrumb */}
      <nav className="ep-breadcrumb">
        <a href={`/${lang}/dashboard`}>{t.backToAccount}</a>
        <span className="material-symbols-outlined ep-chevron">chevron_right</span>
        <span>{t.title}</span>
      </nav>

      {globalSuccess && <div className="ep-global-success">{globalSuccess}</div>}

      <div className="ep-grid">
        {/* ─── Photo card ─────────────────────────────────────────── */}
        <div className="ep-card ep-photo-card">
          <div className="ep-photo-avatar">
            {picture ? (
              <img src={picture} alt="" className="ep-photo-img" />
            ) : (
              <span className="material-symbols-outlined ep-photo-placeholder">person</span>
            )}
            {uploading && (
              <div className="ep-photo-overlay">
                <span className="ep-photo-spinner" />
                {t.photoUpdating}
              </div>
            )}
          </div>

          <div className="ep-photo-actions">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ep-photo-btn"
              disabled={uploading}
            >
              {picture ? t.changePhoto : t.uploadPhoto}
            </button>
            {picture && (
              <button type="button" className="ep-photo-remove" onClick={async () => {
                try {
                  const res = await fetch('/api/user/delete-picture', { method: 'POST' });
                  const data = await res.json();
                  if (data.ok) {
                    setPicture(null);
                    setGlobalSuccess(lang === 'es' ? 'Foto eliminada.' : 'Photo removed.');
                  }
                } catch { /* ignore */ }
              }}>
                {t.removePhoto}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="ep-hidden-input"
              onChange={handleFileChange}
            />
          </div>
          {uploadError && <p className="ep-photo-error">{uploadError}</p>}
        </div>

        {/* ─── Fields card (name + email + password) ──────────────── */}
        <div className="ep-card ep-fields-card">
          <h2 className="ep-card-title">{t.title}</h2>

          <div className="ep-divider" />

          {/* Name */}
          <EditableField
            label={t.nameLabel}
            currentValue={initialName}
            icon="person"
            type="text"
            saving={nameSaving}
            editLabel={t.edit}
            cancelLabel={t.cancel}
            passwordLabel={lang === 'es' ? 'Confirma tu contraseña para guardar este cambio' : 'Confirm your password to save this change'}
            onSave={saveName}
          />

          <div className="ep-divider" />

          {/* Email */}
          <EditableField
            label={t.mailLabel}
            currentValue={initialMail}
            icon="mail"
            type="email"
            saving={nameSaving}
            editLabel={t.edit}
            cancelLabel={t.cancel}
            passwordLabel={lang === 'es' ? 'Confirma tu contraseña para guardar este cambio' : 'Confirm your password to save this change'}
            onSave={saveMail}
          />

          <div className="ep-divider" />

          {/* Password */}
          <div className="ep-pw-section">
            {!showPasswordSection ? (
              <div className="ep-pw-readonly">
                <div className="ep-pw-read-left">
                  <span className="material-symbols-outlined ep-pw-icon">lock_reset</span>
                  <div>
                    <p className="ep-pw-read-label">{t.passwordTitle}</p>
                    <p className="ep-pw-read-value">{'\u2022'.repeat(10)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ep-pw-edit-btn"
                  onClick={() => setShowPasswordSection(true)}
                >
                  {t.changePassword}
                </button>
              </div>
            ) : (
              <div className="ep-pw-editing">
                <div className="ep-pw-edit-header">
                  <span className="material-symbols-outlined ep-pw-icon">lock_reset</span>
                  <span className="ep-pw-edit-title">{t.changePassword}</span>
                </div>

                {/* New password */}
                <div className="field-wrapper">
                  <label className="field-label">{t.newPassword}</label>
                  <div className="field-inner">
                    <span className="material-symbols-outlined field-icon">lock</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="field-input"
                      required
                      minLength={8}
                      placeholder={t.newPasswordPlaceholder}
                    />
                  </div>
                  <PasswordStrengthBar value={newPassword} lang={lang} />
                </div>

                {/* Confirm password */}
                <div className="field-wrapper">
                  <label className="field-label">{t.confirmPassword}</label>
                  <div className="field-inner">
                    <span className="material-symbols-outlined field-icon">check</span>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      className="field-input"
                      required
                      placeholder={t.confirmPasswordPlaceholder}
                    />
                  </div>
                  {confirmPw && (
                    <p className={`ep-pw-match ${passwordsMatch ? 'match' : 'no-match'}`}>
                      <span className="material-symbols-outlined ep-pw-match-icon">
                        {passwordsMatch ? 'check_circle' : 'cancel'}
                      </span>
                      {passwordsMatch ? t.passwordMatch : t.passwordMismatch}
                    </p>
                  )}
                </div>

                {/* Current password */}
                <div className="field-wrapper">
                  <label className="field-label">{t.currentPassword}</label>
                  <div className="field-inner">
                    <span className="material-symbols-outlined field-icon">verified_user</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="field-input"
                      required
                      placeholder={t.currentPasswordPlaceholder}
                    />
                  </div>
                  <p className="ep-pw-hint">{t.currentPasswordHint}</p>
                </div>

                <div className="ep-pw-actions">
                  <button
                    type="button"
                    className="btn-primary ep-pw-save-btn"
                    disabled={
                      passwordSaving ||
                      !newPassword ||
                      !confirmPw ||
                      !currentPassword ||
                      newPassword !== confirmPw ||
                      !isValidPassword(newPassword)
                    }
                    onClick={handlePasswordSave}
                  >
                    {passwordSaving ? <span className="ep-pw-spinner" /> : t.save}
                  </button>
                  <button
                    type="button"
                    className="ep-pw-cancel-btn"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setNewPassword('');
                      setConfirmPw('');
                      setCurrentPassword('');
                    }}
                  >
                    {t.cancelPassword}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ep-page { width: 100%; }

        .ep-breadcrumb {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;
        }
        .ep-breadcrumb a { color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
        .ep-breadcrumb a:hover { color: var(--primary); }
        .ep-breadcrumb span:last-child { color: var(--text-main); font-weight: 600; }
        .ep-chevron { font-size: 1rem; }

        .ep-global-success {
          background: #ecfdf5; border: 1px solid #a7f3d0;
          color: #047857; padding: 0.75rem 1rem; border-radius: 0.5rem;
          font-size: 0.875rem; font-weight: 500; margin-bottom: 1.5rem;
        }

        .ep-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 1.5rem; align-items: start;
        }
        @media (min-width: 768px) {
          .ep-grid { grid-template-columns: auto 1fr; }
        }

        .ep-card {
          background: white; border-radius: 0.75rem;
          border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0 0 0 / 0.04);
          overflow: hidden;
        }

        .ep-card-title {
          font-size: 1.125rem; font-weight: 700; color: var(--text-main);
        }

        .ep-divider { height: 1px; background: var(--border); margin: 0; }

        .ep-fields-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 0; }
        .ep-fields-card .ep-card-title { margin-bottom: 1rem; }

        /* ── Photo card ── */
        .ep-photo-card {
          padding: 1.5rem; display: flex; flex-direction: column;
          align-items: center; gap: 1rem;
        }
        @media (min-width: 768px) { .ep-photo-card { width: 200px; } }
        .ep-photo-avatar {
          position: relative; width: 7rem; height: 7rem;
          border-radius: 9999px; overflow: hidden;
          background: var(--blush); border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
        }
        .ep-photo-img { width: 100%; height: 100%; object-fit: cover; }
        .ep-photo-placeholder { font-size: 3rem; color: var(--text-muted); }
        .ep-photo-overlay {
          position: absolute; inset: 0;
          background: rgba(255 255 255 / 0.8); backdrop-filter: blur(4px);
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.25rem;
          font-size: 0.75rem; font-weight: 600; color: var(--text-main);
        }
        .ep-photo-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid var(--border); border-top-color: var(--primary);
          border-radius: 50%; animation: ep-spin 0.7s linear infinite;
        }
        .ep-photo-actions { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .ep-photo-btn {
          font-size: 0.8125rem; font-weight: 700; color: var(--primary);
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
        }
        .ep-photo-btn:hover { text-decoration: underline; }
        .ep-photo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ep-photo-remove {
          font-size: 0.75rem; color: #ef4444;
          background: none; border: none; cursor: pointer;
        }
        .ep-photo-remove:hover { text-decoration: underline; }
        .ep-hidden-input { display: none; }
        .ep-photo-error { font-size: 0.75rem; color: #dc2626; text-align: center; }

        /* ── Password section ── */
        .ep-pw-section { padding: 1rem 0; }

        .ep-pw-readonly {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .ep-pw-read-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .ep-pw-icon { font-size: 1.5rem; color: var(--primary); opacity: 0.6; flex-shrink: 0; }
        .ep-pw-read-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .ep-pw-read-value { font-size: 0.9375rem; font-weight: 600; color: var(--text-main); letter-spacing: 0.15em; }
        .ep-pw-edit-btn {
          flex-shrink: 0; font-size: 0.8125rem; font-weight: 700; color: var(--primary);
          background: none; border: none; cursor: pointer; white-space: nowrap;
          padding: 0.375rem 0.75rem; border-radius: 0.375rem;
          transition: background 0.15s;
        }
        .ep-pw-edit-btn:hover { background: var(--blush); }

        .ep-pw-editing { display: flex; flex-direction: column; gap: 1rem; }
        .ep-pw-edit-header { display: flex; align-items: center; gap: 0.5rem; }
        .ep-pw-edit-title {
          font-size: 0.875rem; font-weight: 700; color: var(--text-main);
        }
        .ep-pw-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }

        .ep-pw-match {
          display: flex; align-items: center; gap: 0.25rem;
          margin-top: 0.25rem; font-size: 0.8125rem; font-weight: 500;
        }
        .ep-pw-match.match { color: #16a34a; }
        .ep-pw-match.no-match { color: #dc2626; }
        .ep-pw-match-icon { font-size: 1rem; }

        .ep-pw-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem; }
        .ep-pw-save-btn { height: 2.5rem !important; padding-inline: 1.25rem !important; font-size: 0.875rem !important; }
        .ep-pw-cancel-btn {
          font-size: 0.8125rem; font-weight: 600; color: var(--text-muted);
          background: none; border: none; cursor: pointer;
          padding: 0.375rem 0.75rem; border-radius: 0.375rem;
          transition: background 0.15s;
        }
        .ep-pw-cancel-btn:hover { background: var(--blush); color: var(--primary); }
        .ep-pw-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255 255 255 / 0.35);
          border-top-color: white; border-radius: 50%;
          animation: ep-spin 0.7s linear infinite;
        }

        @keyframes ep-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
