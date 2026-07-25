// src/components/courses/CoursesHero.tsx
import { useState, useEffect, useCallback } from 'react';
import type { CoursesHeroSlide } from '@/types/nodehive/content';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

const FALLBACK_SLIDES: CoursesHeroSlide[] = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjSe0_Qz6_SN8vKCVuFwTExt2M0w1wiF_Yg7YsXCnG2_JNpq1VS4Q6oD3DcwFJ_CyxqK9QhQUQBqmcstzzYb-pdGI-knucx9G7SPBnTRDMf_5VvwCEUcpWWtEwPYIAUJaSxCpWVhwO1hj3Cb6O1OTJSkCbRJrF2uIeNVDncz7So3lB6yWvVQ_M33YPUJfStR-0PRDtfDdz4gtxWubxJVjoSa14Sn3KGcrkt18cq00BYpI1Z4lSOj_LCWU_ehKK1IaYcyt54NVnsaA',
    label: 'Academia Floral',
    badgeText: 'Academia Floral',
    badgeColor: 'primary',
    title: 'Descubre el arte\nde las flores',
    description: 'Aprende tecnicas exclusivas con instructores expertos. Cursos presenciales y digitales para todos los niveles.',
    ctaUrl: '#cursos',
    ctaText: 'Ver cursos',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8mwchEpkUA8pbOZR9WjHrkpXY7VSPnp5FFg9882n83E9Spru1bfmnVEycZFPu0uVu23Ho9Y6Ci9aO_WkuwhN_rBo_OQkhth0WjBTtZYjV2iwAEZpeuucQEub5uJTz5EAIe8YXxNCtGR3qfR9-FOHyn2ZXtdDFHj1NHaNEbIVcZGMrvYG5RZZ4NGf3sJtO2pPhUOuJGdIiT1E6CboXLivRDEvaS01gtUQ_5LNL6SYAw_WTFcI4KmhP-H9FUhjNC3aYnDFkXoBaDuo',
    label: 'Talleres Presenciales',
    badgeText: 'Talleres Presenciales',
    badgeColor: 'amber',
    title: 'Aprende haciendo,\nno solo viendo',
    description: 'Talleres practicos con materiales premium incluidos. Grupos pequenos y atencion completamente personalizada.',
    ctaUrl: '#cursos',
    ctaText: 'Ver talleres',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK881TjRvyjdKwtMIxsnY-q6zsslLsA-6MzWft4ZfmyO_7UomhygKEI3aLK64qBd6EIkHqnDt3QWMiIzNLzsjba9FZhWFXTatxsTBdgurt8k9gr0q6bhvYz875rUODNzWyU8d8VadoQkRUwaXw8zV8Vem8Rf8SuJFwotePQPndDPUBVZp6KEHrExCI3sT9h7eFX9giedQOviWE5y4i_sstIaUVxAHNQE6QpPnayp7TaiQOhcSWyuRDNrr08b8suRJ4Ywl5_rcVLDY',
    label: 'Cursos Digitales',
    badgeText: 'Cursos Digitales',
    badgeColor: 'violet',
    title: 'Aprende desde\ndonde estes',
    description: 'Biblioteca de cursos online, acceso de por vida, videos HD y comunidad exclusiva de estudiantes.',
    ctaUrl: '#cursos',
    ctaText: 'Explorar cursos',
  },
];

const BADGE_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  amber: 'bg-amber-500',
  violet: 'bg-violet-600',
  green: 'bg-emerald-600',
};

const CTA_STYLES: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30',
  secondary: 'bg-white/15 hover:bg-white/25 text-white border border-white/35',
};

const INTERVAL = 5000;

interface Props {
  slides?: CoursesHeroSlide[];
  lang?: Lang;
  paragraphId?: string | null;
  paragraphInternalId?: number | null;
  parentId?: string | number | null;
  bundle?: string;
}

export default function CoursesHero({
  slides: slidesProp,
  lang = 'es',
  paragraphId,
  paragraphInternalId,
  parentId,
  bundle,
}: Props) {
  const activeSlides = (slidesProp && slidesProp.length > 0) ? slidesProp : FALLBACK_SLIDES;
  const total = activeSlides.length;

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((index + total) % total);
    setTimeout(() => setIsAnimating(false), 550);
  }, [isAnimating, total]);

  useEffect(() => {
    const timer = setInterval(() => goSlide(current + 1), INTERVAL);
    return () => clearInterval(timer);
  }, [current, goSlide]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(300px,50vw,540px)' }}
      data-nodehive-entity-type={bundle ? 'paragraph' : undefined}
      data-nodehive-entity-bundle={bundle ?? undefined}
      data-nodehive-entity-id={paragraphId ?? undefined}
      data-nodehive-entity-internal-id={paragraphInternalId ?? undefined}
      data-nodehive-parent_id={parentId ?? undefined}
    >
      {activeSlides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <img
            src={slide.image}
            alt={slide.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
              <div className="max-w-xl text-white">
              {slide.badgeText && (
                <span
                  className={`inline-block ${BADGE_COLORS[slide.badgeColor ?? 'primary'] ?? 'bg-primary'} text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4`}
                >
                  {slide.badgeText}
                </span>
              )}
              <h1
                className="text-4xl md:text-5xl font-heading font-semibold leading-tight mb-4 whitespace-pre-line"
                data-nodehive-field="field_title"
              >
                {slide.title}
              </h1>
              {slide.description && (
                <p
                  className="text-white/80 text-sm md:text-base mb-6 leading-relaxed max-w-md"
                  data-nodehive-field="field_description"
                >
                  {slide.description}
                </p>
              )}
              {(slide.ctaUrl || slide.ctaSecondaryUrl) && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {slide.ctaUrl && (
                    <a
                      href={slide.ctaUrl}
                      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all text-[13px] sm:text-sm whitespace-nowrap ${
                        CTA_STYLES[slide.ctaStyle ?? 'primary'] ?? CTA_STYLES.primary
                      }`}
                    >
                      {slide.ctaText ?? t(lang, 'courses.view')}
                      <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_downward</span>
                    </a>
                  )}
                  {slide.ctaSecondaryUrl && (
                    <a
                      href={slide.ctaSecondaryUrl}
                      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all text-[13px] sm:text-sm whitespace-nowrap ${
                        CTA_STYLES[slide.ctaSecondaryStyle ?? 'secondary'] ?? CTA_STYLES.secondary
                      }`}
                    >
                      {slide.ctaSecondaryText ?? t(lang, 'courses.view')}
                      <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-10 overflow-hidden">
        <div
          key={current}
          className="h-full bg-white"
          style={{ animation: 'courses-progress 5s linear forwards' }}
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goSlide(i)}
            className={`h-2 rounded-full border-none cursor-pointer p-0 transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/45'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={() => goSlide(current - 1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all border-none cursor-pointer"
        aria-label="Anterior"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
      </button>
      <button
        onClick={() => goSlide(current + 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all border-none cursor-pointer"
        aria-label="Siguiente"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </button>

      <style>{`@keyframes courses-progress { from { width: 0 } to { width: 100% } }`}</style>
    </section>
  );
}
