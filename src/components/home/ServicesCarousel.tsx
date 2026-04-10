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

const TOTAL     = services.length;
const GAP       = 20;
const CARD_H    = 360;
const IMG_H     = 260;
const ARROW_D   = 44;  // arrow circle diameter
// Arrow is centered at the clip boundary (window left/right edge).
// Padding on the outer wrapper = ARROW_D/2 so arrows fit without clipping.
const SIDE_PAD  = ARROW_D / 2 + 8; // 30px — gives arrows breathing room

// Badge background: whitish-gray warm.
// From globals: between --surface (#fff) and --blush (#fdeff1).
// Using --border (#f0e4e6) as subtle tint reference → slightly lighter: #f6f2f2
const BADGE_BG  = '#f6f2f2';

// Triangle color: --muted (#ad808a) — declared in globals, grayish-pink
const MUTED     = '#ad808a';

export default function ServicesCarousel() {
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

  const prev = useCallback(() => setActive(i => (i - 1 + TOTAL) % TOTAL), []);
  const next = useCallback(() => setActive(i => (i + 1) % TOTAL), []);

  const relPos = (i: number) => {
    let d = i - active;
    if (d >  TOTAL / 2) d -= TOTAL;
    if (d < -TOTAL / 2) d += TOTAL;
    return d;
  };

  // Arrow vertical center = middle of the image area
  const arrowTop = IMG_H / 2 - ARROW_D / 2;

  return (
    <section style={s.section}>

      {/* Header */}
      <div style={s.header}>
        <span style={s.eyebrow}>Experiencias &amp; Servicios</span>
        <h2 style={s.title}>Todo lo que ofrecemos</h2>
        <p style={s.subtitle}>
          Descubre cómo podemos ayudarte a florecer en cada ocasión especial.
        </p>
      </div>

      {/* ── Stage ──────────────────────────────────────────────────────────────
          Outer wrapper: position relative, overflow visible, padded so arrows
          (which straddle the window edge) don't get clipped by the section.
          Inner window: overflow hidden — clips the side cards.
          Arrows: absolute children of outer wrapper, centered on window edges.
      ─────────────────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', paddingInline: SIDE_PAD, maxWidth: 980, margin: '0 auto', marginBottom: '2.25rem' }}>

        {/* Clipping window */}
        <div ref={wrapRef} style={{ position: 'relative', overflow: 'hidden', height: CARD_H, width: '100%' }}>
          {services.map((svc, i) => {
            const rel      = relPos(i);
            const isCenter = rel === 0;
            const show     = Math.abs(rel) <= 1;

            return (
              <div
                key={i}
                onClick={() => !isCenter && setActive(i)}
                aria-hidden={!show}
                style={{
                  position:   'absolute',
                  top:        0,
                  left:       '50%',
                  marginLeft: -cardW / 2,
                  width:      cardW,
                  height:     CARD_H,
                  borderRadius: '1rem',
                  overflow:   'hidden',
                  display:    'flex',
                  flexDirection: 'column',
                  transform:  `translateX(${rel * step}px)`,
                  opacity:    show ? 1 : 0,
                  pointerEvents: show ? 'auto' : 'none',
                  zIndex:     isCenter ? 10 : 5,
                  // Shadow only on center card: offset bottom-right
                  boxShadow:  isCenter ? '8px 12px 32px rgba(109,81,87,0.15)' : 'none',
                  cursor:     isCenter ? 'default' : 'pointer',
                  transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, box-shadow 0.35s ease',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', width: '100%', height: IMG_H, flexShrink: 0, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url('${svc.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  {!isCenter && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.38)', pointerEvents: 'none' }} />
                  )}
                </div>

                {/* Badge */}
                <div style={{ flex: '1 1 0', padding: '0.875rem 1rem 1rem', background: BADGE_BG }}>
                  <p style={{ fontFamily: FONT, fontSize: '0.9375rem', fontWeight: 700, color: HEADLINE, margin: '0 0 0.3rem' }}>
                    {svc.title}
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: '0.8125rem', color: BODY, lineHeight: 1.55, margin: 0 }}>
                    {svc.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Arrow LEFT
            - Absolute child of outer wrapper (overflow: visible)
            - `left: 0` = left edge of the window (= right edge of left padding)
            - translateX(-50%) centers it on that edge
            - So half of the circle sits on the side card, half "outside"        */}
        <button
          onClick={prev}
          aria-label="Anterior"
          style={{ ...s.arrowBtn, left: SIDE_PAD, top: arrowTop, transform: 'translateX(-50%)' }}
        >
          <RoundedTriangle dir="left" color={MUTED} />
        </button>

        {/* Arrow RIGHT */}
        <button
          onClick={next}
          aria-label="Siguiente"
          style={{ ...s.arrowBtn, right: SIDE_PAD, top: arrowTop, transform: 'translateX(50%)' }}
        >
          <RoundedTriangle dir="right" color={MUTED} />
        </button>

      </div>

      {/* Dots */}
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
              background: i === active ? '#eb4763' : 'color-mix(in srgb, #eb4763 28%, transparent)',
            }}
          />
        ))}
      </div>

    </section>
  );
}

/* ── Rounded triangle SVG ────────────────────────────────────────────────────
   Technique: draw the polygon with stroke-linejoin="round" + stroke-width
   matching fill color. Inset the points slightly so rounding stays in bounds.
   Result: a clean filled triangle with softly rounded corners.
────────────────────────────────────────────────────────────────────────────── */
function RoundedTriangle({ dir, color }: { dir: 'left' | 'right'; color: string }) {
  // Inset points 3px from bounding box edges to leave room for rounded stroke
  const pts = dir === 'left'
    ? '13,3 13,15 3,9'   // pointing left
    : '3,3 3,15 13,9';   // pointing right

  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={{ display: 'block' }}>
      <polygon
        points={pts}
        fill={color}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
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

  arrowBtn: {
    position: 'absolute',
    display:  'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width:  ARROW_D,
    height: ARROW_D,
    borderRadius: '9999px',
    background: 'white',
    border: 'none',
    boxShadow: '0 2px 10px rgba(0,0,0,0.13)',
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