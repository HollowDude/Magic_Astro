import { useState, useEffect, useRef, useCallback } from 'react';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

export interface ProductDetailData {
  id: string;
  title: string;
  price: string;
  description: string;
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

export default function ProductDetail({ product, lang }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  
  const mainImgRef = useRef<HTMLImageElement>(null);
  const MAX_CHARS = 150;
  const images = product.images;
  const hasImages = images.length > 0;

  useEffect(() => {
    setImgLoaded(false);
    const img = mainImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, [activeImg]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, []);

  const contactHref = lang === 'en' ? '/en/contact' : '/contact';
  const tipoLabel = product.tipo
    ? (ui[lang] as Record<string, string>)[`shop.filters.type.${product.tipo}`] ?? product.tipo
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

      {/* ═══════════════ GALERÍA ═══════════════ */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        
        {/* Contenedor Imagen Principal */}
        <div
          className={`group relative aspect-[4/5] rounded-2xl overflow-hidden bg-blush isolation-auto ${
            isZooming && imgLoaded ? 'cursor-crosshair' : 'cursor-default'
          }`}
          onMouseEnter={() => hasImages && setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          {hasImages ? (
            <img
              key={activeImg}
              ref={mainImgRef}
              src={images[activeImg]}
              alt={product.title}
              className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-400 ${
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } ${isZooming && imgLoaded ? 'duration-0' : ''}`}
              style={
                isZooming && imgLoaded
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: 'scale(2.2)',
                    }
                  : undefined
              }
              onLoad={() => setImgLoaded(true)}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[5rem] text-primary opacity-20 leading-none">
                local_florist
              </span>
            </div>
          )}

          {product.badge && (
            <span className="absolute top-4 right-4 bg-white/88 backdrop-blur-md px-3.5 py-1.5 rounded-full font-body text-[11px] font-extrabold tracking-widest uppercase text-primary z-10 pointer-events-none shadow-sm">
              {product.badge}
            </span>
          )}

          {/* Indicador de zoom */}
          {hasImages && imgLoaded && !isZooming && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/82 backdrop-blur-md rounded-full font-body text-[11px] font-semibold text-headline pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <span className="material-symbols-outlined !text-base leading-none">zoom_in</span>
              Zoom
            </span>
          )}
        </div>

        {/* Miniaturas */}
        {hasImages && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => i !== activeImg && setActiveImg(i)}
                className={`aspect-square rounded-xl overflow-hidden border-[2.5px] p-0 cursor-pointer bg-blush transition-all duration-200 hover:-translate-y-0.5 ${
                  i === activeImg 
                    ? 'border-primary opacity-100 shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_20%,transparent)]' 
                    : 'border-transparent opacity-55 hover:opacity-85'
                }`}
                aria-label={`${product.title} — imagen ${i + 1}`}
                aria-pressed={i === activeImg}
              >
                <img src={img} alt="" loading="lazy" className="w-full h-full object-cover block" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ INFO ═══════════════ */}
      <div className="flex flex-col gap-5">
        
        {product.category && (
          <p className="font-body text-xs font-bold uppercase tracking-widest text-primary">
            {product.category}
          </p>
        )}

        <h1 className="font-heading text-[clamp(1.625rem,3.5vw,2.375rem)] font-semibold text-headline leading-[1.15] tracking-tight">
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3.5">
          <span className="font-body text-3xl font-extrabold text-primary tracking-tight leading-none">
            {product.price || t(lang, 'shop.price_on_request')}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {product.colorName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blush border border-border font-body text-[13px] font-medium text-body-color">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: product.colorHex || 'var(--muted)',
                    border: `1.5px solid ${product.colorHex ? 'rgba(0,0,0,0.12)' : 'var(--border)'}`,
                  }}
                />
                {product.colorName}
              </span>
            )}
            {tipoLabel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-sage-light border border-sage/25 text-[11px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--sage)_80%,var(--headline))]">
                {tipoLabel}
              </span>
            )}
          </div>
        </div>

        {product.description && (
          <div
            className="font-body text-[15px] lg:text-[16px] leading-relaxed text-body-color prose-custom"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* Personalización */}
        <div className="bg-[color-mix(in_srgb,var(--blush)_60%,white)] border border-border rounded-2xl p-5">
          <label htmlFor="pd-message" className="block font-body text-sm font-bold text-headline mb-1.5">
            {t(lang, 'product.personalization.label')}
          </label>
          <p className="font-body text-xs text-muted leading-relaxed mb-3">
            {t(lang, 'product.personalization.hint')}
          </p>
          <div className="relative">
            <textarea
              id="pd-message"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t(lang, 'product.personalization.placeholder')}
              rows={3}
              className={`w-full rounded-lg border-1.5 bg-white p-3.5 pb-7 font-body text-sm text-headline outline-none transition-all duration-200 focus:border-primary focus:ring-3 focus:ring-primary/12 ${
                message.length >= MAX_CHARS ? 'border-primary/70' : 'border-border'
              }`}
            />
            <span className={`absolute bottom-2 right-3.5 font-body text-[11px] font-medium pointer-events-none transition-colors ${
              message.length >= MAX_CHARS ? 'text-primary font-bold' : 'text-muted'
            }`}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            className="flex-1 btn-primary h-13 shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)] opacity-85 cursor-not-allowed" 
            type="button" 
            disabled
          >
            <span className="material-symbols-outlined !text-xl leading-none">shopping_cart</span>
            {t(lang, 'shop.add_to_cart')}
          </button>

          <a 
            href={contactHref} 
            className="flex-1 flex items-center justify-center gap-2 h-13 bg-white text-headline border-1.5 border-border rounded-xl font-body text-base font-bold no-underline transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/[0.04]"
          >
            <span className="material-symbols-outlined !text-xl leading-none">chat</span>
            {t(lang, 'product.contact')}
          </a>
        </div>

        <p className="flex items-center justify-center gap-1.5 font-body text-[13px] text-muted">
          <span className="material-symbols-outlined !text-base leading-none">local_shipping</span>
          {t(lang, 'product.free_shipping')}
        </p>
      </div>
    </div>
  );
}