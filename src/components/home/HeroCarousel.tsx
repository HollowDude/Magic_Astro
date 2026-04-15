// src/components/home/HeroCarousel.tsx
import { useState, useEffect, useCallback } from 'react';
import type { HeroSlide } from '@/types/blocks';
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
  title?:       string;
  slogan?:      string | null;
  description?: string;
  slides?:      HeroSlide[];
  lang?:        Lang;
}

const INTERVAL = 5000;

export default function HeroCarousel({
  title,
  slogan,
  description,
  slides,
  lang = 'es',
}: Props) {
  const fallbackTitle       = t(lang, 'hero.title');
  const fallbackSlogan      = t(lang, 'hero.slogan');
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
  const activeSlogan      = slogan      ?? fallbackSlogan;
  const activeDescription = description ?? fallbackDescription;
  const activeSlides      = (slides && slides.length > 0) ? slides : fallbackSlides;

  const prefix      = lang === 'es' ? '' : '/en';
  const shopHref    = `${prefix}/shop`;
  const coursesHref = `${prefix}/courses`;

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
    <section style={s.section}>
      {activeSlides.map((slide, i) => {
        const isCurrent = i === active;
        const isPrev    = i === prev;
        return (
          <div
            key={i}
            aria-hidden={!isCurrent}
            style={{
              ...s.slide,
              backgroundImage: `url('${slide.image}')`,
              opacity:   isCurrent ? 1 : isPrev ? 0 : 0,
              transform: isCurrent ? 'scale(1)' : isPrev ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
              zIndex:    isCurrent ? 1 : isPrev ? 0 : -1,
            }}
          />
        );
      })}

      <div style={s.overlay} />

      <div style={s.content}>
        <h1 style={s.title}>{activeTitle}</h1>
        {activeSlogan && <h2 style={s.subtitle}>{activeSlogan}</h2>}
        <p style={s.desc}>{activeDescription}</p>
        <div style={s.ctas}>
          <a href={shopHref}    style={s.ctaPrimary}>{t(lang, 'hero.cta.shop')}</a>
          <a href={coursesHref} style={s.ctaSecondary}>{t(lang, 'hero.cta.courses')}</a>
        </div>
      </div>

      {activeSlides.length > 1 && (
        <div style={s.dots} role="tablist" aria-label={t(lang, 'hero.slide.nav')}>
          {activeSlides.map((slide, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`${t(lang, 'hero.slide.label')} ${i + 1}: ${slide.label}`}
              onClick={() => goTo(i)}
              style={{
                ...s.dot,
                width:      i === active ? '2rem' : '0.5rem',
                background: i === active ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  section: {
    position:        'relative',
    width:           '100%',
    minHeight:       '600px',
    overflow:        'hidden',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  slide: {
    position:           'absolute',
    inset:              0,
    backgroundSize:     'cover',
    backgroundPosition: 'center',
    willChange:         'opacity, transform',
  },
  overlay: {
    position:   'absolute',
    inset:      0,
    background: 'linear-gradient(to bottom, rgba(20,5,10,0.38) 0%, rgba(20,5,10,0.55) 100%)',
    zIndex:     2,
  },
  content: {
    position:       'relative',
    zIndex:         10,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    textAlign:      'center',
    gap:            '1.25rem',
    maxWidth:       '52rem',
    padding:        '5rem 1.5rem',
  },
  title: {
    fontSize:      'clamp(2.25rem, 6vw, 4rem)',
    fontWeight:    900,
    lineHeight:    1.1,
    letterSpacing: '-0.03em',
    color:         'white',
    textShadow:    '0 2px 16px rgba(0,0,0,0.3)',
    fontFamily:    'var(--font-body)',
    margin:        0,
  },
  subtitle: {
    fontSize:      'clamp(1.25rem, 3vw, 2rem)',
    fontWeight:    700,
    lineHeight:    1.25,
    // Blush semitransparente sobre el overlay oscuro del hero — no existe como token
    color:         '#fbdadd',
    letterSpacing: '-0.02em',
    fontFamily:    'var(--font-body)',
    margin:        0,
  },
  desc: {
    maxWidth:   '38rem',
    fontSize:   'clamp(1rem, 2vw, 1.125rem)',
    lineHeight: 1.7,
    color:      'rgba(255,255,255,0.88)',
    fontFamily: 'var(--font-body)',
    margin:     0,
  },
  ctas: {
    marginTop:      '0.75rem',
    display:        'flex',
    flexWrap:       'wrap',
    gap:            '1rem',
    justifyContent: 'center',
  },
  ctaPrimary: {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    height:          '3rem',
    minWidth:        '10rem',
    padding:         '0 2rem',
    borderRadius:    '9999px',
    background:      'var(--primary)',
    color:           'white',
    fontSize:        '1rem',
    fontWeight:      700,
    textDecoration:  'none',
    fontFamily:      'var(--font-body)',
    boxShadow:       '0 4px 18px color-mix(in srgb, var(--primary) 45%, transparent)',
    transition:      'transform 0.2s, background 0.2s',
  },
  ctaSecondary: {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    height:          '3rem',
    minWidth:        '10rem',
    padding:         '0 2rem',
    borderRadius:    '9999px',
    background:      'rgba(255,255,255,0.92)',
    color:           '#181112',
    fontSize:        '1rem',
    fontWeight:      700,
    textDecoration:  'none',
    fontFamily:      'var(--font-body)',
    backdropFilter:  'blur(4px)',
    transition:      'transform 0.2s, background 0.2s',
  },
  dots: {
    position:  'absolute',
    bottom:    '1.75rem',
    left:      '50%',
    transform: 'translateX(-50%)',
    zIndex:    10,
    display:   'flex',
    gap:       '0.4rem',
    alignItems:'center',
  },
  dot: {
    height:      '0.5rem',
    borderRadius:'9999px',
    border:      'none',
    cursor:      'pointer',
    padding:     0,
    transition:  'width 0.35s ease, background 0.35s ease',
  },
};