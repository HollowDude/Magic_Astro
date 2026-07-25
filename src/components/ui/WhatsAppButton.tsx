import type { Lang } from '@/i18n/ui';

interface Props {
  lang: Lang;
  phoneNumber: string | null;
  messageEs: string | null;
  messageEn: string | null;
  isEnabled: boolean;
  entityType?: string;
  bundle?: string;
  fragmentId?: string;
  fragmentInternalId?: number | null;
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\+]/g, '');
}

export default function WhatsAppButton({
  lang, phoneNumber, messageEs, messageEn, isEnabled,
  entityType, bundle, fragmentId, fragmentInternalId,
}: Props) {
  if (!phoneNumber || !isEnabled) return null;

  const cleanedPhone = cleanPhoneNumber(phoneNumber);
  const message = lang === 'es' ? messageEs : messageEn;
  const href = `https://wa.me/${cleanedPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  return (
    <div
      data-nodehive-entity-type={entityType}
      data-nodehive-entity-bundle={bundle}
      data-nodehive-entity-id={fragmentId}
      data-nodehive-entity-internal-id={fragmentInternalId}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        data-nodehive-field="field_zelle"
        className="fixed bottom-6 right-6 z-55 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#128C7E] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl group"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.496.727 4.82 1.976 6.78L2.06 29.94l7.24-1.892A13.92 13.92 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.2c-2.132 0-4.188-.596-5.956-1.724l-.428-.272-4.296 1.124 1.148-4.192-.28-.444A11.17 11.17 0 014.8 16C4.8 9.812 9.812 4.8 16 4.8S27.2 9.812 27.2 16 22.188 27.2 16 27.2z"/>
          <path d="M23.536 18.064c-.332-.164-1.964-.968-2.268-1.08-.304-.108-.524-.164-.748.164-.22.328-.864 1.08-1.06 1.3-.192.22-.384.248-.716.084-.332-.168-1.404-.516-2.676-1.652-.988-.88-1.656-1.968-1.852-2.3-.192-.332-.02-.512.144-.676.148-.148.332-.384.5-.576.164-.192.22-.332.328-.548.108-.22.056-.412-.028-.576-.084-.164-.748-1.8-1.024-2.464-.272-.652-.544-.56-.748-.568-.192-.012-.412-.012-.632-.012-.22 0-.576.084-.88.416-.3.332-1.152 1.128-1.152 2.748s1.18 3.192 1.344 3.412c.164.22 2.304 3.508 5.58 4.92 1.88.808 2.616.888 3.548.748.672-.1 1.964-.804 2.24-1.58.276-.776.276-1.44.192-1.58-.08-.136-.3-.216-.632-.38z"/>
        </svg>
        <span
          data-nodehive-field="field_message"
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
        >
          WhatsApp
        </span>
      </a>
    </div>
  );
}
