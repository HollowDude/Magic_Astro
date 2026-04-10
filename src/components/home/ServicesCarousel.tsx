// src/components/home/ServicesCarousel.tsx
import { useState, useCallback, useEffect, useRef } from 'react';

const services = [
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

const TOTAL      = services.length;
const GAP        = 20;    // px between cards
const ARROW_SIZE = 44;    // px — diameter of arrow button

// Badge bg: using --surface (#ffffff) tinted with a whisper of the brand blush
// Closest neutral from globals: white (#ffffff). We apply a very subtle warm tint.
const BADGE_BG   = '#f8f5f5'; // white-gray warm — between --surface and --blush

export default function ServicesCarousel() {
  const [active, setActive] = useState(0);
  const wrapRef             = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW]   = useState(0);

  // Card takes ~56% of the window; the remaining 44% is split as peek on each side
  const cardW = wrapW > 0 ? Math.round(wrapW * 0.56) : 420;
  const step  = cardW + GAP;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.offsetWidth));
    ro.observe(el);
    setWrapW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const prev = useCallback(() => setActive(i => (i - 1 + TOTAL) % TOTAL), []);
  const next = useCallback(() => setActive(i => (i + 1) % TOTAL), []);

  const relPos = (i: number) => {
    let d = i - active;
    if (d >  TOTAL / 2) d -= TOTAL;
    if (d < -TOTAL / 2) d += TOTAL;
    return d;
  };

  // Image area height (everything except the badge) used to center arrows
  const IMG_H  = 260; // px  ← matches imgWrap flex height
  const CARD_H = 360; // px  ← total card height

  return (
    <section style={s.section}>

      {/* ── Header ── */}
      <div style={s.header}>
        <span style={s.eyebrow}>Experiencias &amp; Servicios</span>
        <h2 style={s.title}>Todo lo que ofrecemos</h2>
        <p style={s.subtitle}>
          Descubre cómo podemos ayudarte a florecer en cada ocasión especial.
        </p>
      </div>

      {/* ── Outer wrapper — arrows are absolute children straddling the clip edge ── */}
      <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', paddingInline: '1.5rem', marginBottom: '2.25rem' }}>

        {/* Clipping window */}
        <div ref={wrapRef} style={{ ...s.window, height: CARD_H }}>
          {services.map((svc, i) => {
            const rel      = relPos(i);
            const isCenter = rel === 0;
            const show     = Math.abs(rel) <= 1;
            const offsetX  = rel * step;

            return (
              <div
                key={i}
                onClick={() => !isCenter && setActive(i)}
                aria-hidden={!show}
                style={{
                  ...s.card,
                  width:      cardW,
                  height:     CARD_H,
                  left:       '50%',
                  marginLeft: -cardW / 2,
                  transform:  `translateX(${offsetX}px)`,
                  opacity:    show ? 1 : 0,
                  pointerEvents: show ? 'auto' : 'none',
                  zIndex:     isCenter ? 10 : 5,
                  // Shadow only for center card: offset bottom-right
                  boxShadow:  isCenter
                    ? '6px 10px 28px rgba(109,81,87,0.16)'
                    : 'none',
                  cursor: isCenter ? 'default' : 'pointer',
                }}
              >
                {/* Image */}
                <div style={{ ...s.imgWrap, height: IMG_H }}>
                  <div style={{ ...s.img, backgroundImage: `url('${svc.image}')` }} />
                  {!isCenter && <div style={s.dimOverlay} />}
                </div>

                {/* Badge — whitish-gray warm background */}
                <div style={{ ...s.badge, background: BADGE_BG }}>
                  <p style={s.cardTitle}>{svc.title}</p>
                  <p style={s.cardDesc}>{svc.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Arrow LEFT — centered vertically in the image area, at left edge of window ── */}
        <button
          onClick={prev}
          aria-label="Anterior"
          style={{
            ...s.arrowBtn,
            left:  -ARROW_SIZE / 2,
            top:   IMG_H / 2 - ARROW_SIZE / 2,
          }}
        >
          {/* Filled black triangle pointing LEFT */}
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <polygon points="14,0 14,16 0,8" fill="#181112" />
          </svg>
        </button>

        {/* ── Arrow RIGHT ── */}
        <button
          onClick={next}
          aria-label="Siguiente"
          style={{
            ...s.arrowBtn,
            right: -ARROW_SIZE / 2,
            top:   IMG_H / 2 - ARROW_SIZE / 2,
          }}
        >
          {/* Filled black triangle pointing RIGHT */}
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <polygon points="0,0 0,16 14,8" fill="#181112" />
          </svg>
        </button>

      </div>

      {/* ── Dots ── */}
      <div style={s.dots} role="tablist">
        {services.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            style={{
              ...s.dot,
              width:      i === active ? '2rem' : '0.625rem',
              background: i === active
                ? '#eb4763'
                : 'color-mix(in srgb, #eb4763 28%, transparent)',
            }}
          />
        ))}
      </div>

    </section>
  );
}

/* ── Tokens ── */
const PRIMARY  = '#eb4763';
const HEADLINE = '#6d5157';
const BODY     = '#89656b';
const FONT     = "'Be Vietnam Pro', sans-serif";

const s: Record<string, React.CSSProperties> = {
  section: {
    background: '#ffffff',
    padding: '5rem 0 4rem',
    overflow: 'hidden',
  },

  header: {
    textAlign: 'center',
    marginBottom: '3rem',
    paddingInline: '1rem',
  },
  eyebrow: {
    display: 'block',
    fontFamily: FONT,
    fontSize: '0.8125rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: PRIMARY,
    marginBottom: '0.5rem',
  },
  title: {
    fontFamily: FONT,
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: HEADLINE,
    margin: '0 0 0.75rem',
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: '1rem',
    color: BODY,
    margin: 0,
  },

  // Clips neighbors — only half of adjacent cards visible
  window: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    marginBottom: 20,
  },

  card: {
    position: 'absolute',
    top: 0,
    borderRadius: '1rem',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: [
      'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
      'opacity 0.3s ease',
      'box-shadow 0.35s ease',
    ].join(', '),
  },

  imgWrap: {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
    width: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  dimOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none',
  },

  badge: {
    flex: '1 1 0',
    padding: '0.875rem 1rem 1rem',
  },
  cardTitle: {
    fontFamily: FONT,
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: HEADLINE,
    margin: '0 0 0.3rem',
  },
  cardDesc: {
    fontFamily: FONT,
    fontSize: '0.8125rem',
    color: BODY,
    lineHeight: 1.55,
    margin: 0,
  },

  // Arrow button: white circle, straddling the clip edge of the window
  arrowBtn: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width:  ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: '9999px',
    background: 'white',
    border: 'none',
    boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
    cursor: 'pointer',
    zIndex: 20,
    transition: 'box-shadow 0.2s, transform 0.15s',
  },

  dots: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.4rem',
  },
  dot: {
    height: '0.625rem',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'width 0.3s ease, background 0.3s ease',
  },
};