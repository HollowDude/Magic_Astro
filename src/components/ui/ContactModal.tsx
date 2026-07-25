import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lang } from '@/i18n/ui';

const MAP_EMBED_URL = 'https://maps.google.com/maps?q=Hialeah+Gardens+FL+33018&output=embed';
const MAP_LINK_URL  = 'https://maps.google.com/?q=Hialeah+Gardens+FL+33018';

interface Props {
  lang: Lang;
  phone: string | null;
  email: string | null;
  address: string | null;
  schedule: string | null;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    title:            'Contáctenos',
    name_label:       'Nombre',
    name_placeholder: 'Tu nombre',
    email_label:      'Correo electrónico',
    email_placeholder: 'tu@correo.com',
    message_label:    'Mensaje',
    message_placeholder: 'Escribe tu mensaje aquí...',
    send:             'Enviar mensaje',
    sending:          'Enviando...',
    phone_label:      'Teléfono / Zelle',
    email_info:       'Correo',
    address_label:    'Dirección',
    schedule_label:   'Horario',
    open_in_maps:     'Abrir en Maps',
    success_title:    '¡Mensaje enviado!',
    success_desc:     'Gracias por contactarnos. Te responderemos a la brevedad.',
    error_name:       'El nombre es obligatorio.',
    error_email:      'Correo electrónico no válido.',
    error_message:    'El mensaje es obligatorio.',
    error_server:     'No se pudo enviar el mensaje. Intenta de nuevo.',
    chars:            'caracteres',
  },
  en: {
    title:            'Contact Us',
    name_label:       'Name',
    name_placeholder: 'Your name',
    email_label:      'Email',
    email_placeholder: 'you@example.com',
    message_label:    'Message',
    message_placeholder: 'Write your message here...',
    send:             'Send message',
    sending:          'Sending...',
    phone_label:      'Phone / Zelle',
    email_info:       'Email',
    address_label:    'Address',
    schedule_label:   'Schedule',
    open_in_maps:     'Open in Maps',
    success_title:    'Message sent!',
    success_desc:     'Thank you for contacting us. We will get back to you shortly.',
    error_name:       'Name is required.',
    error_email:      'Invalid email address.',
    error_message:    'Message is required.',
    error_server:     'Could not send your message. Please try again.',
    chars:            'characters',
  },
};

const MAX_CHARS = 500;

function t(lang: Lang, key: string): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.es[key] ?? key;
}

export default function ContactModal({ lang, phone, email, address, schedule }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setSent(false);
    setServerError('');
    setErrors({});
    setName('');
    setEmailVal('');
    setMessage('');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handler = () => open();
    window.addEventListener('open-contact-modal', handler);
    return () => window.removeEventListener('open-contact-modal', handler);
  }, [open]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', esc);
    };
  }, [isOpen, close]);

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = t(lang, 'error_name');
    if (!emailVal.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) errs.email = t(lang, 'error_email');
    if (!message.trim()) errs.message = t(lang, 'error_message');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: emailVal.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
      } else {
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field]: data.error }));
        } else {
          setServerError(data.error ?? t(lang, 'error_server'));
        }
      }
    } catch {
      setServerError(t(lang, 'error_server'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) close();
  };

  if (!isOpen) return null;

  const fallbackPhone = '(305) 555-0123';
  const fallbackEmail = 'maggy_flowers@yahoo.com';
  const fallbackAddress = 'Hialeah Gardens, FL 33018';
  const fallbackSchedule = 'Lunes a Viernes, 9:00am – 6:00pm (Hora Florida – EDT)';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211114]/60 backdrop-blur-sm p-4"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto flex flex-col lg:flex-row"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-blush text-headline border-none cursor-pointer transition-colors hover:bg-primary-alpha-20"
          aria-label="Close"
        >
          <span className="material-symbols-outlined !text-xl leading-none">close</span>
        </button>

        <div className="flex-1 p-6 sm:p-8 lg:p-10">
          <h2
            ref={titleRef}
            id="contact-modal-title"
            tabIndex={-1}
            className="font-heading text-[clamp(1.5rem,3vw,2rem)] font-semibold text-headline leading-tight mb-6 outline-none"
          >
            {t(lang, 'title')}
          </h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined !text-5xl text-sage mb-4 leading-none">check_circle</span>
              <h3 className="font-heading text-xl font-semibold text-headline mb-2">{t(lang, 'success_title')}</h3>
              <p className="font-body text-sm text-body-color max-w-xs">{t(lang, 'success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="field-wrapper">
                <label htmlFor="cm-name" className="field-label">{t(lang, 'name_label')}</label>
                <input
                  id="cm-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder={t(lang, 'name_placeholder')}
                  className={`field-input !pl-4 !pr-4 ${errors.name ? '!border-primary !shadow-none' : ''}`}
                />
                {errors.name && <p className="font-body text-xs text-primary mt-1">{errors.name}</p>}
              </div>

              <div className="field-wrapper">
                <label htmlFor="cm-email" className="field-label">{t(lang, 'email_label')}</label>
                <input
                  id="cm-email"
                  type="email"
                  value={emailVal}
                  onChange={(e) => { setEmailVal(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder={t(lang, 'email_placeholder')}
                  className={`field-input !pl-4 !pr-4 ${errors.email ? '!border-primary !shadow-none' : ''}`}
                />
                {errors.email && <p className="font-body text-xs text-primary mt-1">{errors.email}</p>}
              </div>

              <div className="field-wrapper">
                <label htmlFor="cm-message" className="field-label">{t(lang, 'message_label')}</label>
                <textarea
                  id="cm-message"
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                    setErrors((p) => ({ ...p, message: undefined }));
                  }}
                  placeholder={t(lang, 'message_placeholder')}
                  rows={4}
                  className={`field-input !pl-4 !pr-4 !h-auto min-h-[7rem] py-3 resize-y ${errors.message ? '!border-primary !shadow-none' : ''}`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.message ? (
                    <p className="font-body text-xs text-primary">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className={`font-body text-xs ${message.length >= MAX_CHARS ? 'text-primary font-bold' : 'text-muted'}`}>
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {serverError && (
                <div className="bg-blush border border-primary/20 rounded-lg px-4 py-3">
                  <p className="font-body text-sm font-medium text-primary m-0">{serverError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full h-12 text-base"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t(lang, 'sending')}
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-xl leading-none">send</span>
                    {t(lang, 'send')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 bg-blush p-6 sm:p-8 lg:p-10 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <ContactInfoItem icon="phone_iphone" label={t(lang, 'phone_label')} value={phone ?? fallbackPhone} />
            <ContactInfoItem icon="mail" label={t(lang, 'email_info')} value={email ?? fallbackEmail} href={`mailto:${email ?? fallbackEmail}`} />
            <ContactInfoItem icon="location_on" label={t(lang, 'address_label')} value={address ?? fallbackAddress} />
            <ContactInfoItem icon="schedule" label={t(lang, 'schedule_label')} value={schedule ?? fallbackSchedule} />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="rounded-xl overflow-hidden border border-border aspect-[4/3] bg-white">
              <iframe
                src={MAP_EMBED_URL}
                title="Ubicación"
                loading="lazy"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
            <a
              href={MAP_LINK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white text-headline border-1.5 border-border font-body text-sm font-bold no-underline transition-all duration-200 hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined !text-lg leading-none">map</span>
              {t(lang, 'open_in_maps')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactInfoItem({ icon, label, value, href }: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined !text-xl text-primary mt-0.5 leading-none shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-body text-[11px] font-bold uppercase tracking-widest text-muted mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="font-body text-sm font-semibold text-headline no-underline hover:text-primary transition-colors break-words">
            {value}
          </a>
        ) : (
          <p className="font-body text-sm font-semibold text-headline m-0 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}
