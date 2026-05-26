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
  tag: string | null;
  tipo: string | null;
  colorName: string | null;
  colorHex: string | null;
  category: string | null;
  variationId: number | null;
}

interface Props {
  product: ProductDetailData;
  lang: Lang;
  isLoggedIn: boolean;
}

interface RibbonColorDef {
  uuid: string;
  name: string;
  hex: string;
}

const RIBBON_COLORS: RibbonColorDef[] = [
  { uuid: 'd8987a10-0db1-42bf-aa13-1da1c14b1870', name: 'Red',   hex: '#c0392b' },
  { uuid: 'e615fc4b-9caf-4b4d-9d3c-5f31d2a55a44', name: 'Yellow',hex: '#d4ac0d' },
  { uuid: '504b04ad-e74c-4f03-ade1-c5d4ce0af999', name: 'Gray',  hex: '#a8a9ad' },
  { uuid: 'afe8e4c1-d329-4cb2-807e-78e2065ec451', name: 'White', hex: '#ffffff' },
] as const;

const MAX_CHARS = 250;

export default function ProductDetail({ product, lang, isLoggedIn }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [ribbonColorUuid, setRibbonColorUuid] = useState<string | null>(null);
  const [hasCard, setHasCard] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const mainImgRef = useRef<HTMLImageElement>(null);
  const images = product.images;
  const hasImages = images.length > 0;

  const prefix = `/${lang}`;

  useEffect(() => {
    setImgLoaded(false);
    setIsZooming(false);
    if (mainImgRef.current) {
      mainImgRef.current.style.transformOrigin = '50% 50%';
    }
    const img = mainImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, [activeImg]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    if (mainImgRef.current) {
      mainImgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasImages || !imgLoaded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    if (mainImgRef.current) {
      mainImgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
    setIsZooming(true);
  }, [hasImages, imgLoaded]);

  const handleMouseLeave = useCallback(() => setIsZooming(false), []);

  const handleContact = () => {
    window.dispatchEvent(new CustomEvent('open-contact-modal'));
  };
  const loginHref = `${prefix}/login?redirect=${encodeURIComponent(`${prefix}/${product.id}`)}`;
  const tipoLabel = product.tipo
    ? (ui[lang] as Record<string, string>)[`shop.filters.type.${product.tipo}`] ?? product.tipo
    : null;

  const ribbonColorDef = ribbonColorUuid
    ? RIBBON_COLORS.find(c => c.uuid === ribbonColorUuid) ?? null
    : null;

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      window.location.href = loginHref;
      return;
    }
    if (!product.variationId) {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
      return;
    }
    try {
      const body = [{
        purchased_entity_type: 'commerce_product_variation',
        purchased_entity_id: product.variationId,
        quantity: 1,
        combine: true,
      }] as any[];

      if (hasCard && message.trim()) {
        body[0].cardMessage = message.trim();
      }
      if (ribbonColorUuid) {
        body[0].ribbonColor = ribbonColorUuid;
      }

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Cart API error');
      window.dispatchEvent(new CustomEvent('cart:updated'));
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    } catch {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

      {/* ═══════════════ GALERÍA ═══════════════ */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">

        <div
          className={`group relative aspect-[4/5] rounded-2xl overflow-hidden bg-blush isolation-auto ${
            isZooming && imgLoaded ? 'cursor-crosshair' : 'cursor-default'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          {hasImages ? (
            <img
              key={activeImg}
              ref={mainImgRef}
              src={images[activeImg]}
              alt={product.title}
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{
                transform: isZooming && imgLoaded ? 'scale(2.2)' : 'scale(1)',
                transition: isZooming
                  ? 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)'
                  : 'transform 0.35s ease-out, opacity 0.35s ease-out',
                opacity: imgLoaded ? 1 : 0,
                willChange: 'transform',
              }}
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

          {product.tag && (
            <span className="absolute top-4 left-4 bg-amber-200/92 backdrop-blur-md px-3.5 py-1.5 rounded-full font-body text-[11px] font-extrabold tracking-widest uppercase text-amber-900 z-10 pointer-events-none shadow-sm">
              {product.tag}
            </span>
          )}

          {product.badge && (
            <span className="absolute top-4 right-4 bg-white/88 backdrop-blur-md px-3.5 py-1.5 rounded-full font-body text-[11px] font-extrabold tracking-widest uppercase text-primary z-10 pointer-events-none shadow-sm">
              {product.badge}
            </span>
          )}

          {hasImages && imgLoaded && !isZooming && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/82 backdrop-blur-md rounded-full font-body text-[11px] font-semibold text-headline pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <span className="material-symbols-outlined !text-base leading-none">zoom_in</span>
              Zoom
            </span>
          )}
        </div>

        {hasImages && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => i !== activeImg && setActiveImg(i)}
                className={`aspect-square rounded-xl overflow-hidden border-[2.5px] p-0 cursor-pointer bg-blush transition-all duration-200 hover:-translate-y-0.5 ${
                  i === activeImg
                    ? 'border-primary opacity-100 shadow-[0_0_0_3px_var(--primary-alpha-20)]'
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-sage-light border border-sage/25 text-[11px] font-bold uppercase tracking-wider text-[var(--sage-headline-tint)]">
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

        {/* ═══ Tarjeta personalizada ═══ */}
        {hasCard ? (
          <div className="bg-[var(--primary-blush-tint)] border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-bold text-headline">
                {t(lang, 'product.card.label')}
              </p>
              <button
                type="button"
                onClick={() => { setHasCard(false); setMessage(''); }}
                className="font-body text-xs text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                {t(lang, 'product.card.remove')}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
                placeholder={t(lang, 'product.card.placeholder')}
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
        ) : (
          <button
            type="button"
            onClick={() => setHasCard(true)}
            className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--primary-blush-tint)] border border-dashed border-border rounded-2xl font-body text-sm font-bold text-headline hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined !text-lg leading-none">add</span>
            {t(lang, 'product.card.add')}
          </button>
        )}

        {/* ═══ Selector de cinta ═══ */}
        {ribbonColorUuid ? (
          <div className="bg-[var(--primary-blush-tint)] border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-bold text-headline">
                {t(lang, 'product.ribbon.label')}
              </p>
              <button
                type="button"
                onClick={() => setRibbonColorUuid(null)}
                className="font-body text-xs text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                {t(lang, 'product.ribbon.remove')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {RIBBON_COLORS.map((c) => (
                <button
                  key={c.uuid}
                  type="button"
                  onClick={() => setRibbonColorUuid(c.uuid)}
                  className={`w-9 h-9 rounded-full border-2 transition-all duration-150 cursor-pointer shrink-0 ${
                    ribbonColorUuid === c.uuid
                      ? 'border-primary scale-110 shadow-[0_0_0_2px_white,0_0_0_4px_var(--primary)]'
                      : 'border-black/15 hover:scale-105'
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRibbonColorUuid(RIBBON_COLORS[0].uuid)}
            className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--primary-blush-tint)] border border-dashed border-border rounded-2xl font-body text-sm font-bold text-headline hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined !text-lg leading-none">add</span>
            {t(lang, 'product.ribbon.add')}
          </button>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 btn-primary h-13 shadow-[0_4px_16px_var(--primary-alpha-35)] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined !text-xl leading-none">shopping_cart</span>
            {t(lang, 'shop.add_to_cart')}
          </button>

          <button
            type="button"
            onClick={handleContact}
            className="flex-1 flex items-center justify-center gap-2 h-13 bg-white text-headline border-1.5 border-border rounded-xl font-body text-base font-bold transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/[0.04] cursor-pointer"
          >
            <span className="material-symbols-outlined !text-xl leading-none">chat</span>
            {t(lang, 'product.contact')}
          </button>
        </div>

        {addedToast && (
          <div className="bg-sage-light border border-sage/30 rounded-xl px-4 py-3 text-center">
            <p className="font-body text-sm font-semibold text-sage m-0">
              {t(lang, 'product.added_cart')}
            </p>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 font-body text-[13px] text-muted">
          <span className="material-symbols-outlined !text-base leading-none">local_shipping</span>
          {t(lang, 'product.free_shipping')}
        </p>
      </div>
    </div>
  );
}
