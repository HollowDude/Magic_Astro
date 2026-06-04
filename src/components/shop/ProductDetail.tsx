import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';
import AdditionsSelector from './AdditionsSelector';
import type { SelectedAddition } from './AdditionsSelector';

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
  allVariations: VariationDetailData[];
}

export interface VariationDetailData {
  variationId: number | null;
  drupalUuid: string | null;
  colorName: string | null;
  colorHex: string | null;
  tipo: string | null;
  images: string[];
  price: string;
}

interface Props {
  product: ProductDetailData;
  lang: Lang;
  isLoggedIn: boolean;
  selectedVariationId?: string | null;
}

const COLOR_FALLBACK_MAP: Record<string, string> = {
  orange: '#f97316', naranja: '#f97316',
  pink: '#f9a8d4', rosa: '#f9a8d4',
  purple: '#a855f7', morado: '#a855f7', lila: '#a855f7',
  red: '#ef4444', rojo: '#ef4444',
  white: '#f5f5f5', blanco: '#f5f5f5',
  yellow: '#fde047', amarillo: '#fde047',
  blue: '#3b82f6', azul: '#3b82f6',
  green: '#22c55e', verde: '#22c55e',
  ivory: '#f3e7d3', marfil: '#f3e7d3',
  beige: '#d8c3a5',
};

function resolveColorHex(name: string | null, hex: string | null): string {
  if (hex) return hex.startsWith('#') ? hex : `#${hex}`;
  if (!name) return '';
  return COLOR_FALLBACK_MAP[name.toLowerCase()] ?? '';
}

interface RibbonColorDef {
  uuid: string;
  name: string;
  hex: string;
}

const MAX_CHARS = 250;

export default function ProductDetail({ product, lang, isLoggedIn, selectedVariationId }: Props) {
  const initialVarIndex = useMemo(() => {
    if (!selectedVariationId || !product.allVariations?.length) return 0;
    const parsed = parseInt(selectedVariationId, 10);
    const idx = product.allVariations.findIndex(v => v.variationId === parsed);
    return idx >= 0 ? idx : 0;
  }, [selectedVariationId, product.allVariations]);

  const [activeVarIndex, setActiveVarIndex] = useState(initialVarIndex);
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [ribbonColorName, setRibbonColorName] = useState<string | null>(null);
  const [hasCard, setHasCard] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [ribbonColors, setRibbonColors] = useState<RibbonColorDef[]>([]);
  const [selectedAdditions, setSelectedAdditions] = useState<SelectedAddition[]>([]);

  useEffect(() => {
    fetch('/api/ribbon-colors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRibbonColors(data);
        }
      })
      .catch(() => {});
  }, []);

  const allVariations = useMemo<VariationDetailData[]>(() => {
    if (product.allVariations?.length) return product.allVariations;
    return [{
      variationId: product.variationId,
      drupalUuid: null,
      colorName: product.colorName,
      colorHex: product.colorHex,
      tipo: product.tipo,
      images: product.images,
      price: product.price,
    }];
  }, [product]);

  const activeVar = allVariations[activeVarIndex] ?? allVariations[0];
  const hasColorVariants = allVariations.some(v => v.colorName || v.colorHex);

  const mainImgRef = useRef<HTMLImageElement>(null);
  const images = activeVar?.images ?? [];
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

  useEffect(() => {
    setActiveImg(0);
    setImgLoaded(false);
    const img = mainImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, [activeVarIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentVar = allVariations[activeVarIndex];
    if (!currentVar?.variationId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('var', String(currentVar.variationId));
    window.history.replaceState(null, '', url.toString());
  }, [activeVarIndex, allVariations]);

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

  const ribbonColorDef = ribbonColorName
    ? ribbonColors.find(c => c.name.toLowerCase() === ribbonColorName.toLowerCase()) ?? {
        name: ribbonColorName,
        hex: '#cccccc',
        uuid: '',
      }
    : null;

  const handleAddToCart = async () => {
    if (isAdding) return;
    if (!isLoggedIn) {
      window.location.href = loginHref;
      return;
    }
    if (!activeVar?.variationId) {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
      return;
    }
    if (hasCard && !message.trim()) {
      setCardError(true);
      return;
    }
    setCardError(false);
    setIsAdding(true);
    window.dispatchEvent(new CustomEvent('cart:loading', { detail: { active: true, source: 'add' } }));
    try {
      const body = [{
        purchased_entity_type: 'commerce_product_variation',
        purchased_entity_id: activeVar.variationId,
        quantity: 1,
        combine: true,
      }] as any[];

      if (hasCard && message.trim()) {
        body[0].cardMessage = message.trim();
      }
      if (ribbonColorName) {
        body[0].ribbonColor = ribbonColorName;
      }
      if (selectedAdditions.length > 0) {
        body[0].additions = selectedAdditions.map(a => ({
          variationId: a.variationId,
          variationUuid: a.variationUuid,
          quantity: 1,
          productUuid: a.id,
        }));
      }

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Cart API error');
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { delta: 1 } }));
      setAddedToast(true);
      setSelectedAdditions([]);
      setTimeout(() => setAddedToast(false), 3000);
    } catch {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    } finally {
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('cart:loading', { detail: { active: false, source: 'add' } }));
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
            {activeVar?.price || t(lang, 'shop.price_on_request')}
          </span>
          {selectedAdditions.length > 0 && (
            <span className="font-body text-[0.8125rem] text-muted">
              +{t(lang, 'product.additions.in_cart').replace('{n}', String(selectedAdditions.length))}
            </span>
          )}
        </div>

        {hasColorVariants && (
          <div className="flex flex-col gap-2">
            <p className="font-body text-sm font-semibold text-headline">
              {lang === 'es' ? 'Color:' : 'Color:'}{' '}
              <span className="font-normal text-body-color">{activeVar?.colorName ?? ''}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allVariations.map((v, idx) => {
                const hex = resolveColorHex(v.colorName, v.colorHex);
                if (!hex && !v.colorName) return null;
                const isActive = idx === activeVarIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    title={v.colorName ?? undefined}
                    onClick={() => setActiveVarIndex(idx)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'border-primary scale-110 shadow-[0_0_0_2px_white,0_0_0_4px_var(--primary)]'
                        : 'border-black/15 hover:scale-105'
                    }`}
                    style={{ background: hex || 'var(--muted)' }}
                    aria-label={v.colorName ?? (lang === 'es' ? `Variacion ${idx + 1}` : `Variation ${idx + 1}`)}
                    aria-pressed={isActive}
                  />
                );
              })}
            </div>
          </div>
        )}

        {(() => {
          const uniqueTypes = [...new Set(allVariations.map(v => v.tipo).filter(Boolean))];
          if (uniqueTypes.length === 0) return null;
          const hasMultipleTypes = uniqueTypes.length > 1;
          return (
            <div className="flex flex-wrap gap-2">
              {uniqueTypes.map(tipo => {
                const tipoKey = `shop.filters.type.${tipo}` as UiKey;
                const label = (ui[lang] as Record<string, string>)[tipoKey] ?? tipo;
                const isActive = activeVar?.tipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      if (!hasMultipleTypes) return;
                      const idx = allVariations.findIndex(v => v.tipo === tipo);
                      if (idx !== -1) setActiveVarIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                      isActive
                        ? 'bg-sage-light border-sage/40 text-[var(--sage-headline-tint)]'
                        : 'bg-white border-border text-body-color'
                    } ${hasMultipleTypes ? 'cursor-pointer hover:border-sage hover:text-[var(--sage-headline-tint)]' : 'cursor-default'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          );
        })()}

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
                onClick={() => { setHasCard(false); setMessage(''); setCardError(false); }}
                className="font-body text-xs text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                {t(lang, 'product.card.remove')}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value.slice(0, MAX_CHARS)); setCardError(false); }}
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
            {cardError && (
              <p className="mt-2.5 flex items-center gap-1.5 font-body text-sm font-semibold text-red-500">
                <span className="material-symbols-outlined !text-base leading-none">error</span>
                {t(lang, 'product.card.required')}
              </p>
            )}
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
        {ribbonColorName && ribbonColors.length > 0 ? (
          <div className="bg-[var(--primary-blush-tint)] border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-bold text-headline">
                {t(lang, 'product.ribbon.label')}
              </p>
              <button
                type="button"
                onClick={() => setRibbonColorName(null)}
                className="font-body text-xs text-muted hover:text-red-500 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                {t(lang, 'product.ribbon.remove')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {ribbonColors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setRibbonColorName(c.name)}
                  className={`w-9 h-9 rounded-full border-2 transition-all duration-150 cursor-pointer shrink-0 ${
                    ribbonColorName.toLowerCase() === c.name.toLowerCase()
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
        ) : ribbonColors.length > 0 ? (
          <button
            type="button"
            onClick={() => setRibbonColorName(ribbonColors[0].name)}
            className="flex items-center justify-center gap-2 w-full h-12 bg-[var(--primary-blush-tint)] border border-dashed border-border rounded-2xl font-body text-sm font-bold text-headline hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined !text-lg leading-none">add</span>
            {t(lang, 'product.ribbon.add')}
          </button>
        ) : null}

        {/* ═══ Selector de extras ═══ */}
        <AdditionsSelector
          lang={lang}
          selected={selectedAdditions}
          onChange={setSelectedAdditions}
        />

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 btn-primary h-13 shadow-[0_4px_16px_var(--primary-alpha-35)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            type="button"
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {lang === 'es' ? 'Agregando...' : 'Adding...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined !text-xl leading-none">shopping_cart</span>
                {t(lang, 'shop.add_to_cart')}
              </>
            )}
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
