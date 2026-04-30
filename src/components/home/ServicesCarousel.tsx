// src/components/home/ServicesCarousel.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ServiceItem } from '@/services/nodehive/nodehive.service';

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  titulo?:    string | null;
  subTitulo?: string | null;
  eslogan?:   string | null;
  services?:  ServiceItem[];
}

// ── Fallbacks del header ───────────────────────────────────────────────────────

const FALLBACK_HEADER = {
  titulo:    'Experiencias & Servicios',
  subTitulo: 'Todo lo que ofrecemos',
  eslogan:   'Descubre cómo podemos ayudarte a florecer en cada ocasión especial.',
};

// ── Servicios estáticos ────────────────────────────────────────────────────────

const STATIC_SERVICES: ServiceItem[] = [
  {
    title: 'Arreglos florales',
    description: 'Arreglos florales naturales y artificiales diseñados con pasión para cualquier ocasión.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHBQsn_5Q44YxiwJuO0BGJiEuSJmBlqJSh4t7kS9lbeU_QMxn8jFJscWU28PKTlrYEIl8ZKDW6UH6y1aGhpBkenK1H0GqXEpdRupYjgYcer87thOWTvSWaLl9YLpBAbWm3ev5NDXi3LK0oG-QX8hj_NJ6_pONQ-wSqxi11FlR2cH0N49EbMUYCbzc6O4VYcYF9_5eRbK1U91_h8Q8UEwKPxdNOAi4oQQcuhrAtpo9kokwty_pjLGmFWGLmmxX_cdjhvgxJpPBC9IM',
  },
  {
    title: 'Decoración de eventos',
    description: 'Decoración integral de eventos y bodas, creando atmósferas inolvidables y personalizadas.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZYJPEXnahfdXYLmdZPMI6unMMZJsa3aCbkqaBjXg3F4rbXkzlus8JVC9r-qgj5cXWZAhbWVxm325uW1-vv_rjWuaDMS0QMqEr-zyFcyYmr8RxJMpK5axNpfGSxH-npU1MgfWZCwJacIVMAaT3sg9WKWjzgl33rClDnAS_480NYUngpcVMD-nB_4S22sioYuAAGm8bXnMceyaLxZ3haeyWs2P4fg79VZUOsofIwUY5KPC0maeLgMTg-xh9YX1G8hrzn3p7TaFh6rE',
  },
  {
    title: 'Decoración de temporada',
    description: 'Ambientación estacional única para Navidad, otoño y colecciones mensuales exclusivas.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClAOsvayVL44uOfjzXOOKQggcskeBTrlGpa5-DlsI4AO_WZY-arVtQwSQjP4nOj63mbgci7RJ1uNlW6zSTidmqEPSWZIfnrUpSA6ntQGiNVlNyuhLG6qsqhn0MXmgk7tCQf88DEHSR-1UhKkI-NiB2ee0Ubg1kUJRImNxz2WQgQKoDi40x6BDo7XtAm7FAJeD9WAm8FArCm-p--_1WdUmZvMcaSE4Anp8uIMMIpwBF39hdghnocSFga6CYWyR_HwSvjFJp23xmY',
  },
  {
    title: 'Academia de diseño',
    description: 'Aprende el arte floral con nuestra academia, disponible online y presencial.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpl5cPx0JQhJ6j1_l5CvT6i5U3qJksZyG72pKJJFgXCcNV41-8WHQcQDHCVynMSZimVAf1IDVGETyCGAGhOyS2q1VYB1bGalVLjEnLzI1n9gNnlm8p5rStEg0BlX1evZ8R5Qx974XcAKzR9tSCivGkN6vsFge0oki0Luihwor-Fo7cwvFrmsc0ypKqo2ZSnbZglTqyRWcWAXXzKL5zAlmoXC3OQY1VqNe-ZCmy-K3J5zsCUs5od8FYlWoR1wrFOYadfobMyTCkNXM',
  },
  {
    title: 'Colaboraciones',
    description: 'Trabajamos con marcas y eventos como creadora e influencer floral.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm5Caw-nL5EYKbCV27onuLoT7kpNP7TNTz1b_fSOZowvCUzqh4X5uxyeoWmEmFTYaK01KUSSB4TBmMemVBp4pmbd0yOCIkp6uCvyb5FCSEQfENf8CbuiH97XirDpmkUEiI8oyHBmXHM-OYtUAH82Pa1-rrFLzUqNAtKm-Ov5b5KNyZ07ogIOjqoZw2RTWoXeHgFScQ03DFejSlaIsG9UqWSDfWdyzhmalahM6_X5UuOXV2lLTZsijDnH2wnLN6N-8489cZrehidm4',
  },
];

// ── Constantes de layout ──────────────────────────────────────────────────────

const GAP      = 20;
const CARD_H   = 380;
const IMG_H    = 260;
const BODY_H   = CARD_H - IMG_H;
const ARROW_D  = 44;
const SIDE_PAD = ARROW_D / 2 + 8;

export default function ServicesCarousel({
  titulo,
  subTitulo,
  eslogan,
  services: servicesProp = [],
}: Props) {
  const activeServices = servicesProp.length > 0 ? servicesProp : STATIC_SERVICES;
  const TOTAL = activeServices.length;

  const [active, setActive] = useState(0);
  const wrapRef             = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW]   = useState(0);

  const cardW = wrapW > 0 ? Math.round(wrapW * 0.58) : 420;
  const step  = cardW + GAP;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.offsetWidth));
    ro.observe(el);
    setWrapW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const prev = useCallback(() => setActive(i => (i - 1 + TOTAL) % TOTAL), [TOTAL]);
  const next = useCallback(() => setActive(i => (i + 1) % TOTAL), [TOTAL]);

  const relPos = (i: number) => {
    let d = i - active;
    if (d >  TOTAL / 2) d -= TOTAL;
    if (d < -TOTAL / 2) d += TOTAL;
    return d;
  };

  const arrowTop = IMG_H / 2 - ARROW_D / 2;

  return (
    <section className="bg-background py-20 pb-16 overflow-hidden">

      {/* Header */}
      <div className="text-center mb-12 px-4">
        <span className="block font-body text-[0.8125rem] font-bold tracking-[0.08em] uppercase text-primary mb-2">
          {titulo ?? FALLBACK_HEADER.titulo}
        </span>
        <h2 className="font-body text-[clamp(2rem,5vw,3rem)] font-black tracking-[-0.03em] text-headline m-0 mb-3">
          {subTitulo ?? FALLBACK_HEADER.subTitulo}
        </h2>
        {(eslogan ?? FALLBACK_HEADER.eslogan) && (
          <p className="font-body text-base text-body-color m-0">
            {eslogan ?? FALLBACK_HEADER.eslogan}
          </p>
        )}
      </div>

      {/* Stage */}
      <div className="relative max-w-[980px] mx-auto mb-9" style={{ paddingInline: SIDE_PAD }}>

        {/* Clipping window */}
        <div ref={wrapRef} className="relative w-full overflow-hidden" style={{ height: CARD_H }}>
          {activeServices.map((svc, i) => {
            const rel      = relPos(i);
            const isCenter = rel === 0;
            const show     = Math.abs(rel) <= 1;

            return (
              <div
                key={i}
                onClick={() => !isCenter && setActive(i)}
                aria-hidden={!show}
                className={`absolute top-0 flex flex-col rounded-2xl overflow-hidden transition-all duration-[420ms] ease-out ${
                  isCenter ? 'z-10 cursor-default shadow-[8px_12px_32px_color-mix(in_srgb,var(--color-headline)_15%,transparent)]' : 'z-5 cursor-pointer shadow-none'
                }`}
                style={{
                  left: '50%',
                  marginLeft: -cardW / 2,
                  width: cardW,
                  height: CARD_H,
                  transform: `translateX(${rel * step}px)`,
                  opacity: show ? 1 : 0,
                  pointerEvents: show ? 'auto' : 'none',
                }}
              >
                {/* Imagen o placeholder */}
                <div className="relative w-full shrink-0 overflow-hidden" style={{ height: IMG_H }}>
                  {svc.image ? (
                    <img
                      src={svc.image}
                      alt={svc.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-blush))]">
                      <span className="material-symbols-outlined text-[3rem] text-primary opacity-35 leading-none">
                        local_florist
                      </span>
                    </div>
                  )}
                  {!isCenter && (
                    <div className="absolute inset-0 bg-white/40 pointer-events-none transition-colors duration-300" />
                  )}
                </div>

                {/* Cuerpo */}
                <div 
                  className="p-3.5 px-4 pb-4 bg-blush flex flex-col gap-1.5 overflow-hidden"
                  style={{ height: BODY_H }}
                >
                  <p className="font-body text-[0.9375rem] font-bold text-headline m-0 shrink-0">
                    {svc.title}
                  </p>

                  <p className="font-body text-[0.8125rem] text-body-color leading-[1.55] m-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-muted)_transparent]">
                    {svc.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow LEFT */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white border-none shadow-[0_2px_10px_rgba(0,0,0,0.13)] cursor-pointer z-20 transition-transform duration-150 hover:scale-105"
          style={{ left: SIDE_PAD, top: arrowTop, transform: 'translateX(-50%)' }}
        >
          <RoundedTriangle dir="left" />
        </button>

        {/* Arrow RIGHT */}
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white border-none shadow-[0_2px_10px_rgba(0,0,0,0.13)] cursor-pointer z-20 transition-transform duration-150 hover:scale-105"
          style={{ right: SIDE_PAD, top: arrowTop, transform: 'translateX(50%)' }}
        >
          <RoundedTriangle dir="right" />
        </button>

      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-1.5" role="tablist">
        {activeServices.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-[0.625rem] rounded-full border-none cursor-pointer p-0 transition-all duration-300 ease-out ${
              i === active ? 'w-8 bg-primary' : 'w-2.5 bg-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]'
            }`}
          />
        ))}
      </div>

    </section>
  );
}

// ── Rounded triangle SVG ──────────────────────────────────────────────────────

function RoundedTriangle({ dir }: { dir: 'left' | 'right' }) {
  const pts = dir === 'left'
    ? '13,3 13,15 3,9'
    : '3,3 3,15 13,9';

  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" className="block">
      <polygon
        points={pts}
        fill="var(--color-muted)"
        stroke="var(--color-muted)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}