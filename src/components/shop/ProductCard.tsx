// src/components/shop/ProductCard.tsx
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface ProductCardData {
  id: string;
  title: string;
  price: string;
  priceNumber: number;
  thumbnail: string | null;
  badge: string | null;
  tipo: string | null;
  colorName: string | null;
  colorHex: string | null;
  category: string | null;
}

interface Props {
  product: ProductCardData;
  lang?: Lang;
}

export default function ProductCard({ product, lang = 'es' }: Props) {
  const dotFill    = product.colorHex || (product.colorName ? 'var(--muted)' : 'transparent');
  const dotBorder  = product.colorHex || (product.colorName ? 'var(--muted)' : 'var(--border)');
  const dotTitle   = product.colorName ?? undefined;

  return (
    <article className="pc-card">
      {/* Imagen */}
      <div className="pc-img-wrap">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="pc-img"
            loading="lazy"
          />
        ) : (
          <div className="pc-img pc-img--ph">
            <span className="material-symbols-outlined pc-ph-icon">local_florist</span>
          </div>
        )}

        {product.badge && (
          <span className="pc-badge">{product.badge}</span>
        )}

        <div
          className="pc-color-dot"
          title={dotTitle}
          aria-label={product.colorName ?? undefined}
          style={{
            background:  dotFill,
            border:      `2px solid ${dotBorder}`,
            cursor:      product.colorName ? 'help' : 'default',
          }}
        />
      </div>

      {/* Cuerpo */}
      <div className="pc-body">
        <div className="pc-meta">
          <div style={{ minWidth: 0 }}>
            {product.category && (
              <p className="pc-category">{product.category}</p>
            )}
            <h3 className="pc-title">{product.title}</h3>
          </div>
          <span className="pc-price">
            {product.price || t(lang, 'shop.price_on_request')}
          </span>
        </div>

        <button
          className="pc-cart"
          type="button"
          disabled
          title={lang === 'es' ? 'Próximamente' : 'Coming soon'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', lineHeight: 1 }}>
            shopping_bag
          </span>
          {t(lang, 'shop.add_to_cart')}
        </button>
      </div>

      <style>{`
        .pc-card {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid var(--border);
          transition: box-shadow 0.3s ease, transform 0.25s ease;
        }
        .pc-card:hover {
          box-shadow: 0 12px 36px color-mix(in srgb, var(--headline) 12%, transparent);
          transform: translateY(-3px);
        }

        /* Imagen */
        .pc-img-wrap {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: var(--blush);
          flex-shrink: 0;
        }
        .pc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .pc-card:hover .pc-img { transform: scale(1.05); }

        .pc-img--ph {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--primary) 8%, var(--blush));
        }
        .pc-ph-icon { font-size: 3rem !important; color: var(--primary); opacity: 0.35; }

        /* Badge tipo */
        .pc-badge {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          padding: 0.2rem 0.625rem;
          font-family: var(--font-body);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: var(--primary);
          color: white;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        /* Círculo de color */
        .pc-color-dot {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          width: 1.125rem;
          height: 1.125rem;
          border-radius: 9999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          transition: transform 0.2s ease;
        }
        .pc-card:hover .pc-color-dot {
          transform: scale(1.15);
        }

        /* Botón favorito */
        .pc-fav {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 2.375rem;
          height: 2.375rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--headline);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(3.5rem);
          transition: transform 0.3s ease, background 0.2s, color 0.2s;
        }
        .pc-card:hover .pc-fav { transform: translateY(0); }
        .pc-fav:hover { background: var(--primary); color: white; }

        /* Cuerpo */
        .pc-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }
        .pc-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.625rem;
        }

        /* Categoría */
        .pc-category {
          font-family: var(--font-body);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--primary);
          margin: 0 0 0.2rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Título con fuente de titulares */
        .pc-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 600;
          color: var(--headline);
          margin: 0;
          line-height: 1.3;
          transition: color 0.2s;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pc-card:hover .pc-title { color: var(--primary); }

        .pc-price {
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 700;
          color: var(--headline);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Botón carrito */
        .pc-cart {
          width: 100%;
          height: 2.625rem;
          background: var(--muted);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 700;
          cursor: not-allowed;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.2s;
          opacity: 0.88;
        }
        .pc-card:hover .pc-cart {
          background: var(--primary);
          opacity: 1;
        }
      `}</style>
    </article>
  );
}