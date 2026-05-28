import { useState, useRef } from 'react';

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
    name: 'Nombre de usuario',
    namePlaceholder: 'Tu nombre',
    mail: 'Correo electrónico',
    mailPlaceholder: 'tu@email.com',
    password: 'Contraseña actual',
    passwordPlaceholder: 'Tu contraseña actual',
    passwordHint: 'Necesaria para guardar los cambios',
    changePassword: 'Cambiar contraseña',
    cancelPassword: 'Cancelar cambio',
    newPassword: 'Nueva contraseña',
    newPasswordPlaceholder: 'Nueva contraseña',
    newPasswordHint: 'Se aplicará al guardar los cambios',
    save: 'Guardar cambios',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    success: 'Perfil actualizado correctamente.',
    errorServer: 'No se pudo actualizar el perfil.',
    changePhoto: 'Cambiar foto',
    removePhoto: 'Eliminar foto',
    uploadPhoto: 'Subir foto',
    photoSaving: 'Subiendo...',
    photoError: 'Error al subir la foto.',
    photoUpdating: 'Cambiando foto...',
    backToAccount: 'Volver a mi cuenta',
  },
  en: {
    title: 'Edit Profile',
    name: 'Username',
    namePlaceholder: 'Your name',
    mail: 'Email address',
    mailPlaceholder: 'you@email.com',
    password: 'Current password',
    passwordPlaceholder: 'Your current password',
    passwordHint: 'Required to save changes',
    changePassword: 'Change password',
    cancelPassword: 'Cancel change',
    newPassword: 'New password',
    newPasswordPlaceholder: 'New password',
    newPasswordHint: 'It will apply when you save changes',
    save: 'Save changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    success: 'Profile updated successfully.',
    errorServer: 'Could not update profile.',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    uploadPhoto: 'Upload photo',
    photoSaving: 'Uploading...',
    photoError: 'Error uploading photo.',
    photoUpdating: 'Updating photo...',
    backToAccount: 'Back to my account',
  },
};

export default function EditProfileForm({ lang, initialName, initialMail, initialPicture, userUuid }: Props) {
  const t = T[lang];
  const [name, setName] = useState(initialName);
  const [mail, setMail] = useState(initialMail);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(initialPicture);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name.trim(),
          mail: mail.trim(),
          userUuid,
          currentPassword: password,
          newPassword: newPassword ? newPassword : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMsg(t.success);
        setPassword('');
        setNewPassword('');
        setShowNewPassword(false);
      } else {
        setErrorMsg(data.error ?? t.errorServer);
      }
    } catch {
      setErrorMsg(t.errorServer);
    } finally {
      setSaving(false);
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
        setSuccessMsg(t.success);
      } else {
        setUploadError(data.error ?? t.photoError);
      }
    } catch {
      setUploadError(t.photoError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-xs text-body-color mb-2">
        <a href={`/${lang}/dashboard`} class="hover:text-primary transition-colors">
          {lang === 'es' ? 'Mi Cuenta' : 'My Account'}
        </a>
        <span class="material-symbols-outlined text-[14px] leading-none">chevron_right</span>
        <span class="text-headline font-semibold">{t.title}</span>
      </nav>

      <div class="grid grid-cols-1 sm:grid-cols-[auto_1fr] lg:grid-cols-3 gap-6">
        {/* Profile picture */}
        <div class="bg-white rounded-xl border border-border shadow-sm p-6 flex flex-col items-center gap-4 sm:w-48 sm:shrink-0">
          <div class="relative w-28 h-28 rounded-full overflow-hidden bg-background-muted border-2 border-border flex items-center justify-center">
            {picture ? (
              <img src={picture} alt="" class="w-full h-full object-cover" />
            ) : (
              <span class="material-symbols-outlined text-5xl text-muted">person</span>
            )}
            {uploading && (
              <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-xs text-headline font-semibold">
                <span class="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                {t.photoUpdating}
              </div>
            )}
          </div>

          {uploading ? (
            <div class="text-sm text-body-color flex items-center gap-2">
              <span class="inline-block w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin"></span>
              {t.photoSaving}
            </div>
          ) : (
            <div class="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                class="text-sm font-semibold text-primary hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {picture ? t.changePhoto : t.uploadPhoto}
              </button>
              {picture && (
                <button type="button" onClick={async () => {
                  try {
                    const res = await fetch('/api/user/delete-picture', { method: 'POST' });
                    const data = await res.json();
                    if (data.ok) {
                      setPicture(null);
                      setSuccessMsg(lang === 'es' ? 'Foto eliminada.' : 'Photo removed.');
                    }
                  } catch { /* ignore */ }
                }} class="text-xs text-red-500 hover:underline">
                  {t.removePhoto}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {uploadError && (
            <p class="text-xs text-red-500 text-center">{uploadError}</p>
          )}
        </div>

        {/* Profile form */}
        <div class="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm p-6">
          <h1 class="text-xl font-bold text-headline mb-6">{t.title}</h1>

          {successMsg && (
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-5">
            <div class="field-wrapper">
              <label class="field-label">{t.name}</label>
              <div class="field-inner">
                <span class="material-symbols-outlined field-icon">person</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  class="field-input"
                  required
                  minLength={3}
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>

            <div class="field-wrapper">
              <label class="field-label">{t.mail}</label>
              <div class="field-inner">
                <span class="material-symbols-outlined field-icon">mail</span>
                <input
                  type="email"
                  value={mail}
                  onChange={e => setMail(e.target.value)}
                  class="field-input"
                  required
                  placeholder={t.mailPlaceholder}
                />
              </div>
            </div>

            {showNewPassword ? (
              <div class="field-wrapper">
                <label class="field-label">{t.newPassword}</label>
                <div class="field-inner">
                  <span class="material-symbols-outlined field-icon">lock_reset</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    class="field-input"
                    placeholder={t.newPasswordPlaceholder}
                  />
                </div>
                <p class="text-xs text-body-color mt-1">{t.newPasswordHint}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewPassword(true)}
                class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <span class="material-symbols-outlined !text-base">lock_reset</span>
                {t.changePassword}
              </button>
            )}

            <div class="field-wrapper">
              <label class="field-label">{t.password} *</label>
              <div class="field-inner">
                <span class="material-symbols-outlined field-icon">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  class="field-input"
                  required
                  minLength={1}
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <p class="text-xs text-body-color mt-1">{t.passwordHint}</p>
              {showNewPassword && (
                <button
                  type="button"
                  onClick={() => { setShowNewPassword(false); setNewPassword(''); }}
                  class="mt-2 text-xs text-muted hover:text-primary hover:underline"
                >
                  {t.cancelPassword}
                </button>
              )}
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !password} class="btn-primary text-sm !h-10 !px-6 !text-base">
                {saving ? t.saving : t.save}
              </button>
              <a
                href={`/${lang}/dashboard`}
                class="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-border text-body-color font-semibold text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {t.cancel}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
