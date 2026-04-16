// src/components/shop/ProductDetail.tsx
//
// Island de React para la página de detalle del producto.
// Maneja: galería interactiva, personalización (textarea), acciones.

import { useState } from 'react';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

// ── Helper de traducción ──────────────────────────────────────────────────────

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

// ── Tipos públicos ────────────────────────────────────────────────────────────

/**
 * Datos del producto ya normalizados por la página Astro.
 * Desacoplados del modelo de Drupal para que el componente sea reutilizable.
 */
export interface ProductDetailData {
  id: string;
  title: string;
  price: string;
  /** HTML procesado de body.processed — renderizado con dangerouslySetInnerHTML */
  description: string;
  /** URLs absolutas de las imágenes del producto */
  images: string[];
  badge: string | null;
  tipo: string | null;
  colorName: string | null;
  colorHex: string | null;
  category: string | null;
}

interface Props {
  product: ProductDetailData;
  lang: Lang;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ProductDetail({ product, lang }: Props) {
  const [activeImg, setActiveImg]   = useState(0);
  const [message,   setMessage]     = useState('');
  const [imgLoaded, setImgLoaded]   = useState(false);

  const MAX_CHARS = 150;
  const images    = product.images;
  const hasImages = images.length > 0;

  function handleThumb(i: number) {
    if (i === activeImg) return;
    setImgLoaded(false);
    setActiveImg(i);
  }

  const contactHref = lang === 'en' ? '/en/contact' : '/contact';
  const shopHref    = lang === 'en' ? '/en/' : '/';

  const tipoLabel = product.tipo
    ? (ui[lang] as Record<string, string>)[`shop.filters.type.${product.tipo}`] ?? product.tipo
    : null;

  return (
    <div className="pd-grid">

      {/* ═══════════════ GALERÍA ═══════════════ */}
      <div className="pd-gallery">

        {/* Imagen principal */}
        <div className="pd-main-wrap">
          {hasImages ? (
            <img
              key={activeImg}
              src={images[activeImg]}
              alt={product.title}
              className={`pd-main-img${imgLoaded ? ' pd-main-img--loaded' : ''}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="pd-main-ph">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '5rem', color: 'var(--primary)', opacity: 0.2, lineHeight: 1 }}
              >
                local_florist
              </span>
            </div>
          )}

          {product.badge && (
            <span className="pd-badge">{product.badge}</span>
          )}
        </div>

        {/* Miniaturas */}
        {hasImages && (
          <div className="pd-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => handleThumb(i)}
                className={`pd-thumb${i === activeImg ? ' pd-thumb--active' : ''}`}
                aria-label={`${product.title} — imagen ${i + 1}`}
                aria-pressed={i === activeImg}
              >
                <img src={img} alt="" loading="lazy" className="pd-thumb-img" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ INFO ═══════════════ */}
      <div className="pd-info">

        {/* Categoría */}
        {product.category && (
          <p className="pd-category">{product.category}</p>
        )}

        {/* Título */}
        <h1 className="pd-title">{product.title}</h1>

        {/* Precio + color */}
        <div className="pd-price-row">
          <span className="pd-price">
            {product.price || t(lang, 'shop.price_on_request')}
          </span>

          <div className="pd-chips">
            {product.colorName && (
              <span className="pd-chip">
                <span
                  className="pd-chip-dot"
                  style={{
                    background: product.colorHex || 'var(--muted)',
                    border:     `1.5px solid ${product.colorHex ? 'rgba(0,0,0,0.12)' : 'var(--border)'}`,
                  }}
                />
                {product.colorName}
              </span>
            )}
            {tipoLabel && (
              <span className="pd-chip pd-chip--tipo">{tipoLabel}</span>
            )}
          </div>
        </div>

        {/* Descripción */}
        {product.description && (
          <div
            className="pd-desc"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* Personalización */}
        <div className="pd-person-card">
          <label htmlFor="pd-message" className="pd-person-label">
            {t(lang, 'product.personalization.label')}
          </label>
          <p className="pd-person-hint">
            {t(lang, 'product.personalization.hint')}
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              id="pd-message"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t(lang, 'product.personalization.placeholder')}
              rows={3}
              className={`pd-textarea${message.length >= MAX_CHARS ? ' pd-textarea--limit' : ''}`}
            />
            <span className={`pd-char-count${message.length >= MAX_CHARS ? ' pd-char-count--limit' : ''}`}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pd-actions">
          <button className="pd-btn-cart" type="button" disabled>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              shopping_cart
            </span>
            {t(lang, 'shop.add_to_cart')}
          </button>

          <a href={contactHref} className="pd-btn-contact">
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              chat
            </span>
            {t(lang, 'product.contact')}
          </a>
        </div>

        {/* Nota de envío */}
        <p className="pd-shipping">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', lineHeight: 1 }}>
            local_shipping
          </span>
          {t(lang, 'product.free_shipping')}
        </p>
      </div>

      {/* ═══════════════ ESTILOS ═══════════════ */}
      <style>{`
        /* Layout grid — apilado en mobile, 2 col en lg */
        .pd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 1024px) {
          .pd-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: start;
          }
        }

        /* ── Galería ── */
        .pd-gallery {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 5.5rem;
        }

        .pd-main-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          border-radius: 1rem;
          overflow: hidden;
          background: var(--blush);
        }

        .pd-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.02);
          transition: opacity 0.4s ease, transform 0.5s ease;
        }
        .pd-main-img--loaded {
          opacity: 1;
          transform: scale(1);
        }

        .pd-main-ph {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pd-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(6px);
          padding: 0.3rem 0.875rem;
          border-radius: 9999px;
          font-family: var(--font-body);
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--primary);
        }

        .pd-thumbs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .pd-thumb {
          aspect-ratio: 1;
          border-radius: 0.625rem;
          overflow: hidden;
          border: 2px solid transparent;
          padding: 0;
          cursor: pointer;
          opacity: 0.6;
          background: var(--blush);
          transition: border-color 0.2s, opacity 0.2s, box-shadow 0.2s;
        }
        .pd-thumb:hover {
          opacity: 0.85;
        }
        .pd-thumb--active {
          border-color: var(--primary);
          opacity: 1;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
        }

        .pd-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* ── Info ── */
        .pd-info {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .pd-category {
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--primary);
          margin: 0;
        }

        .pd-title {
          font-family: var(--font-heading);
          font-size: clamp(1.625rem, 3.5vw, 2.375rem);
          font-weight: 600;
          color: var(--headline);
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .pd-price-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.875rem;
        }

        .pd-price {
          font-family: var(--font-body);
          font-size: 1.875rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .pd-chips {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .pd-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background: var(--blush);
          border: 1px solid var(--border);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--body-color);
        }

        .pd-chip--tipo {
          background: var(--sage-light);
          border-color: color-mix(in srgb, var(--sage) 25%, transparent);
          color: color-mix(in srgb, var(--sage) 80%, var(--headline));
          font-weight: 700;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pd-chip-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 9999px;
          flex-shrink: 0;
        }

        /* Descripción HTML de Drupal */
        .pd-desc {
          font-family: var(--font-body);
          font-size: 0.9375rem;
          line-height: 1.75;
          color: var(--body-color);
        }
        .pd-desc p { margin: 0 0 0.75rem; }
        .pd-desc p:last-child { margin-bottom: 0; }
        .pd-desc ul, .pd-desc ol {
          padding-left: 1.375rem;
          margin: 0.5rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .pd-desc li {
          color: var(--body-color);
          font-size: 0.9375rem;
          line-height: 1.6;
        }
        .pd-desc strong { color: var(--headline); font-weight: 700; }

        /* Personalización */
        .pd-person-card {
          background: color-mix(in srgb, var(--blush) 60%, white);
          border: 1px solid var(--border);
          border-radius: 0.875rem;
          padding: 1.25rem;
        }

        .pd-person-label {
          display: block;
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--headline);
          margin-bottom: 0.375rem;
        }

        .pd-person-hint {
          font-family: var(--font-body);
          font-size: 0.75rem;
          color: var(--muted);
          line-height: 1.5;
          margin: 0 0 0.75rem;
        }

        .pd-textarea {
          width: 100%;
          border-radius: 0.5rem;
          border: 1.5px solid var(--border);
          background: white;
          padding: 0.75rem 0.875rem;
          padding-bottom: 1.75rem; /* space for char counter */
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--headline);
          resize: none;
          outline: none;
          line-height: 1.55;
          transition: border-color 0.2s, box-shadow 0.2s;
          display: block;
        }
        .pd-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
        }
        .pd-textarea::placeholder { color: var(--muted); }
        .pd-textarea--limit { border-color: color-mix(in srgb, var(--primary) 70%, transparent); }

        .pd-char-count {
          position: absolute;
          bottom: 0.5rem;
          right: 0.875rem;
          font-family: var(--font-body);
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--muted);
          pointer-events: none;
          line-height: 1;
        }
        .pd-char-count--limit { color: var(--primary); font-weight: 700; }

        /* Botones */
        .pd-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .pd-actions { flex-direction: row; }
        }

        .pd-btn-cart {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 3.25rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.625rem;
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 700;
          cursor: not-allowed;
          opacity: 0.85;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .pd-btn-cart:not(:disabled):hover {
          background: var(--primary-dark);
          box-shadow: 0 6px 22px color-mix(in srgb, var(--primary) 45%, transparent);
        }

        .pd-btn-contact {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 3.25rem;
          background: white;
          color: var(--headline);
          border: 1.5px solid var(--border);
          border-radius: 0.625rem;
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .pd-btn-contact:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: color-mix(in srgb, var(--primary) 4%, white);
        }

        /* Nota envío */
        .pd-shipping {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          font-family: var(--font-body);
          font-size: 0.8125rem;
          color: var(--muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}