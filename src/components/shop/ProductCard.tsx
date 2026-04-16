// src/components/shop/ProductCard.tsx
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

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
  href?: string;
}

export default function ProductCard({ product, lang = 'es', href }: Props) {
  const dotFill = product.colorHex || (product.colorName ? 'var(--muted)' : 'transparent');
  const dotBorder = product.colorHex || (product.colorName ? 'var(--muted)' : 'var(--border)');

  return (
    <article className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12_36px_color-mix(in_srgb,var(--headline)_12%,transparent)]">
      
      {/* Overlay de enlace */}
      {href && (
        <a
          href={href}
          aria-label={product.title}
          className="absolute inset-0 z-10 rounded-xl"
        />
      )}

      {/* Contenedor de Imagen */}
      <div className="relative aspect-[4/5] overflow-hidden bg-blush shrink-0">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--blush))]">
            <span className="material-symbols-outlined text-[3rem] text-primary opacity-35">
              local_florist
            </span>
          </div>
        )}

        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 font-body text-[0.6875rem] font-bold uppercase tracking-widest bg-primary text-white rounded-full shadow-md">
            {product.badge}
          </span>
        )}

        {/* Círculo de color */}
        <div
          className="absolute bottom-4 left-4 w-4.5 h-4.5 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-115"
          title={product.colorName ?? undefined}
          style={{
            background: dotFill,
            border: `2px solid ${dotBorder}`,
            cursor: product.colorName ? 'help' : 'default',
          }}
        />
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start gap-2.5">
          <div className="min-w-0">
            {product.category && (
              <p className="font-body text-[0.6875rem] font-bold uppercase tracking-widest text-primary mb-1 truncate">
                {product.category}
              </p>
            )}
            <h3 className="font-heading text-base font-semibold text-headline leading-tight truncate transition-colors duration-200 group-hover:text-primary">
              {product.title}
            </h3>
          </div>
          <span className="font-body text-base font-bold text-headline whitespace-nowrap shrink-0">
            {product.price || t(lang, 'shop.price_on_request')}
          </span>
        </div>

        <button
          className="relative z-20 w-full h-10.5 bg-muted text-white rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2 opacity-88 transition-all duration-200 cursor-not-allowed group-hover:bg-primary group-hover:opacity-100"
          type="button"
          disabled
          title={lang === 'es' ? 'Próximamente' : 'Coming soon'}
        >
          <span className="material-symbols-outlined !text-[1.125rem] leading-none">
            shopping_bag
          </span>
          {t(lang, 'shop.add_to_cart')}
        </button>
      </div>
    </article>
  );
}