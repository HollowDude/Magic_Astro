// src/components/home/ServicesCarousel.tsx
import { useRef, useState } from 'react';

const services = [
  {
    title: 'Arreglos florales',
    description: 'Arreglos florales naturales y artificiales diseñados con pasión y detalle para cualquier ocasión.',
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
    description: 'Aprende el arte floral con nuestra academia de diseño floral, disponible tanto online como presencial.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpl5cPx0JQhJ6j1_l5CvT6i5U3qJksZyG72pKJJFgXCcNV41-8WHQcQDHCVynMSZimVAf1IDVGETyCGAGhOyS2q1VYB1bGalVLjEnLzI1n9gNnlm8p5rStEg0BlX1evZ8R5Qx974XcAKzR9tSCivGkN6vsFge0oki0Luihwor-Fo7cwvFrmsc0ypKqo2ZSnbZglTqyRWcWAXXzKL5zAlmoXC3OQY1VqNe-ZCmy-K3J5zsCUs5od8FYlWoR1wrFOYadfobMyTCkNXM',
  },
  {
    title: 'Colaboraciones',
    description: 'Trabajamos con marcas y eventos a través de colaboraciones como creadora e influencer floral.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm5Caw-nL5EYKbCV27onuLoT7kpNP7TNTz1b_fSOZowvCUzqh4X5uxyeoWmEmFTYaK01KUSSB4TBmMemVBp4pmbd0yOCIkp6uCvyb5FCSEQfENf8CbuiH97XirDpmkUEiI8oyHBmXHM-OYtUAH82Pa1-rrFLzUqNAtKm-Ov5b5KNyZ07ogIOjqoZw2RTWoXeHgFScQ03DFejSlaIsG9UqWSDfWdyzhmalahM6_X5UuOXV2lLTZsijDnH2wnLN6N-8489cZrehidm4',
  },
];

export default function ServicesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('.service-card');
    const card = cards[index] as HTMLElement;
    if (card) {
      container.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  const prev = () => scrollTo(Math.max(0, activeIndex - 1));
  const next = () => scrollTo(Math.min(services.length - 1, activeIndex + 1));

  return (
    <section style={{ background: 'white', padding: '6rem 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', paddingInline: '1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <span style={{
            display: 'block', marginBottom: '0.75rem',
            fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9eb395',
          }}>
            Experiencias &amp; Servicios
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900, letterSpacing: '-0.03em', color: '#181112',
          }}>
            Todo lo que ofrecemos
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: '#886369' }}>
            Descubre cómo podemos ayudarte a florecer en cada ocasión especial.
          </p>
        </div>

        {/* Carousel */}
        <div style={{ position: 'relative' }}>
          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="hide-scrollbar"
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              gap: '1.5rem',
              paddingBottom: '2rem',
              paddingInline: '1rem',
            }}
          >
            {services.map((svc, i) => (
              <div
                key={i}
                className="service-card"
                style={{
                  minWidth: '70vw',
                  scrollSnapAlign: 'center',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '1rem',
                  border: '1px solid #f0e4e6',
                  background: '#fdf8f9',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0 0 0 / 0.06)',
                  transition: 'box-shadow 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0 0 0 / 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0 0 0 / 0.06)')}
              >
                <div style={{ aspectRatio: '1', width: '100%', overflow: 'hidden', background: '#e8f7ee' }}>
                  <div
                    style={{
                      width: '100%', height: '100%',
                      backgroundImage: `url('${svc.image}')`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      transition: 'transform 0.7s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: '#181112' }}>
                    {svc.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#886369', lineHeight: 1.6 }}>
                    {svc.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Prev arrow */}
          <button
            onClick={prev}
            aria-label="Anterior"
            style={{
              position: 'absolute', left: '-1.25rem', top: '33%', transform: 'translateY(-50%)',
              display: 'none',
              alignItems: 'center', justifyContent: 'center',
              width: '3rem', height: '3rem', borderRadius: '9999px',
              background: 'white', border: '1px solid #f0e4e6',
              boxShadow: '0 2px 8px rgba(0 0 0 / 0.1)',
              cursor: 'pointer', color: '#9eb395',
              transition: 'transform 0.2s',
            }}
            className="carousel-arrow"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {/* Next arrow */}
          <button
            onClick={next}
            aria-label="Siguiente"
            style={{
              position: 'absolute', right: '-1.25rem', top: '33%', transform: 'translateY(-50%)',
              display: 'none',
              alignItems: 'center', justifyContent: 'center',
              width: '3rem', height: '3rem', borderRadius: '9999px',
              background: 'white', border: '1px solid #f0e4e6',
              boxShadow: '0 2px 8px rgba(0 0 0 / 0.1)',
              cursor: 'pointer', color: '#9eb395',
              transition: 'transform 0.2s',
            }}
            className="carousel-arrow"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Dots */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Ir a slide ${i + 1}`}
              style={{
                height: '0.625rem',
                width: i === activeIndex ? '2rem' : '0.625rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: i === activeIndex ? '#eb4763' : 'color-mix(in srgb, #eb4763 30%, transparent)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .service-card { min-width: 280px !important; }
        }
        @media (min-width: 1024px) {
          .service-card { min-width: 300px !important; }
          .carousel-arrow { display: flex !important; }
        }
      `}</style>
    </section>
  );
}
