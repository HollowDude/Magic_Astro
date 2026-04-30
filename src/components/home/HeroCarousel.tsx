// src/components/home/HeroCarousel.tsx
import { useState, useEffect, useCallback } from 'react';
import type { HeroSlide } from '@/types/nodehive.paragraphs';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  title?:        string | null;
  subtitle?:     string | null;
  description?:  string | null;
  slides?:       HeroSlide[];
  ctaButtons?:   Array<{ text: string; url: string; style: 'primary' | 'secondary' }>;
  lang?:         Lang;
}

const INTERVAL = 5000;

export default function HeroCarousel({
  title,
  subtitle,
  description,
  slides,
  ctaButtons,
  lang = 'es',
}: Props) {
  const fallbackTitle       = t(lang, 'hero.title');
  const fallbackSubtitle    = t(lang, 'hero.slogan');
  const fallbackDescription = t(lang, 'hero.description');
  const fallbackSlides: HeroSlide[] = [
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmfhRgp0YzWzhd83FdBXzXp9ckxvZH0OoBp-ZhpwTJwEFtuj4ws5sLcGmm5i04XI-5LZYEM31EFKcadzdHmPys2agdyWua0gCEFM-f6d3Yiv9P7iRFcf15FXOeRQzM34cxehEOdIobG2AfUzRMMUPbVJd51FgqUQehzPT7Fdt-3a6mDCvLPsGhFqNP-or_J-9ziCaw3COOgI0T8TrdOZY9Sf_VGuFcgt0S5g-PAvzHiAoQn9MLH2qPvNrXyRWIpHJ7Hw907RF0JmI',
      label: t(lang, 'hero.slide.natural'),
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjSe0_Qz6_SN8vKCVuFwTExt2M0w1wiF_Yg7YsXCnG2_JNpq1VS4Q6oD3DcwFJ_CyxqK9QhQUQBqmcstzzYb-pdGI-knucx9G7SPBnTRDMf_5VvwCEUcpWWtEwPYIAUJaSxCpWVhwO1hj3Cb6O1OTJSkCbRJrF2uIeNVDncz7So3lB6yWvVQ_M33YPUJfStR-0PRDtfDdz4gtxWubxJVjoSa14Sn3KGcrkt18cq00BYpI1Z4lSOj_LCWU_ehKK1IaYcyt54NVnsaA',
      label: t(lang, 'hero.slide.exclusive'),
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxs5NlWSf1_sZqYDP3MuvYSmKhli00fhQbpnpt7Sw1ROJhZ32ColhwrVhmOojwXVfr_S9aYkX9Q4IqwrPEmHNj8ThynAA_3HjaJW06mOUgvW_1C5h8T49djElHDEFM3BPC6WZ-4-wj_JWSY1dDUPX9oPGjZexXpMyabJLeo3d8Y3Y50YOLQ8ZNJUkAWVNYT8gfFrFD1wCcdGw4lBixS7VivWxBMSkoVBZQ9iX_ABacSbIFLgee1zQ-sA5whi4Dm9J28DVr53lQgAo',
      label: t(lang, 'hero.slide.events'),
    },
  ];

  const activeTitle       = title       ?? fallbackTitle;
  const activeSubtitle    = subtitle    ?? fallbackSubtitle;
  const activeDescription = description ?? fallbackDescription;
  const activeSlides      = (slides && slides.length > 0) ? slides : fallbackSlides;
  const activeCtaButtons  = ctaButtons && ctaButtons.length > 0 ? ctaButtons : null;

  const [active,      setActive]      = useState(0);
  const [prev,        setPrev]        = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPrev(active);
    setActive(index);
    setTimeout(() => { setPrev(null); setIsAnimating(false); }, 700);
  }, [active, isAnimating]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((cur) => {
        const next = (cur + 1) % activeSlides.length;
        setPrev(cur);
        setIsAnimating(true);
        setTimeout(() => { setPrev(null); setIsAnimating(false); }, 700);
        return next;
      });
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <section className="relative w-full min-h-[600px] overflow-hidden flex items-center justify-center">
      {activeSlides.map((slide, i) => {
        const isCurrent = i === active;
        const isPrev    = i === prev;
        return (
          <div
            key={i}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 bg-cover bg-center will-change-[opacity,transform] transition-all duration-700 ease-out ${
              isCurrent ? 'opacity-100 scale-100 z-10' : isPrev ? 'opacity-0 scale-105 z-0' : 'opacity-0 scale-100 -z-10'
            }`}
            style={{
              backgroundImage: `url('${slide.image}')`,
            }}
          />
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,5,10,0.38)] to-[rgba(20,5,10,0.55)] z-[2]" />

      <div className="relative z-10 flex flex-col items-center text-center gap-5 max-w-[52rem] py-20 px-6">
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-black leading-[1.1] tracking-[-0.03em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.3)] font-body m-0">
          {activeTitle}
        </h1>
        {activeSubtitle && (
          <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-bold leading-tight text-[#fbdadd] tracking-[-0.02em] font-body m-0">
            {activeSubtitle}
          </h2>
        )}
        <p className="max-w-[38rem] text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-white/90 font-body m-0">
          {activeDescription}
        </p>
        {activeCtaButtons ? (
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {activeCtaButtons.map((btn, i) => (
              <a
                key={i}
                href={btn.url}
                className={`inline-flex items-center justify-center h-12 min-w-[10rem] px-8 rounded-full text-base font-bold no-underline font-body transition-all duration-200 hover:scale-105 ${
                  btn.style === 'primary'
                    ? 'bg-primary text-white shadow-[0_4px_18px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-primary-dark'
                    : 'bg-white/90 text-[#181112] backdrop-blur-[4px] hover:bg-white'
                }`}
              >
                {btn.text}
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <a
              href={lang === 'es' ? '/shop' : '/en/shop'}
              className="inline-flex items-center justify-center h-12 min-w-[10rem] px-8 rounded-full bg-primary text-white text-base font-bold no-underline font-body shadow-[0_4px_18px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition-all duration-200 hover:scale-105 hover:bg-primary-dark"
            >
              {t(lang, 'hero.cta.shop')}
            </a>
            <a
              href={lang === 'es' ? '/courses' : '/en/courses'}
              className="inline-flex items-center justify-center h-12 min-w-[10rem] px-8 rounded-full bg-white/90 text-[#181112] text-base font-bold no-underline font-body backdrop-blur-[4px] transition-all duration-200 hover:scale-105 hover:bg-white"
            >
              {t(lang, 'hero.cta.courses')}
            </a>
          </div>
        )}
      </div>

      {activeSlides.length > 1 && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 items-center" role="tablist" aria-label={t(lang, 'hero.slide.nav')}>
          {activeSlides.map((slide, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`${t(lang, 'hero.slide.label')} ${i + 1}: ${slide.label}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full border-none cursor-pointer p-0 transition-all duration-300 ease-out ${
                i === active ? 'w-8 bg-white' : 'w-2 bg-white/45 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}