// src/components/shop/ProductCard.tsx
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';
import { useState, useMemo, useEffect } from 'react';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

export interface VariationData {
  variationId: number | null;
  colorName: string | null;
  colorHex: string | null;
  tipo: string | null;
  thumbnail: string | null;
  drupalUuid?: string | null;
}

export interface ProductCardData {
  id: string;
  title: string;
  price: string;
  priceNumber: number;
  thumbnail: string | null;
  badge: string | null;
  tag: string | null;
  tipo: string | null;
  colorName: string | null;
  colorHex: string | null;
  category: string | null;
  ocasiones: string[];
  variationId: number | null;
  variations: VariationData[];
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

interface Props {
  product: ProductCardData;
  lang?: Lang;
  href?: string;
  isLoggedIn?: boolean;
  allowedTipos?: Set<string>;
}

export default function ProductCard({ product, lang = 'es', href, isLoggedIn = false, allowedTipos }: Props) {
  // Índice de la variación seleccionada
  const [activeVarIndex, setActiveVarIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // Variación activa: si hay variaciones propias usarlas,
  // si no, construir una con los datos de primer nivel para compatibilidad
  const allVariations: VariationData[] = useMemo(() => {
    if (product.variations && product.variations.length > 0) {
      return product.variations;
    }
    // fallback para datos sin variations array
    return [{
      variationId: product.variationId,
      colorName: product.colorName,
      colorHex: product.colorHex,
      tipo: product.tipo,
      thumbnail: product.thumbnail,
      drupalUuid: null,
    }];
  }, [product]);

  const visibleVariations = useMemo(() => {
    if (!allowedTipos || allowedTipos.size === 0) return allVariations;
    const filtered = allVariations.filter(v => v.tipo && allowedTipos.has(v.tipo));
    return filtered.length > 0 ? filtered : allVariations;
  }, [allVariations, allowedTipos]);

  useEffect(() => {
    if (activeVarIndex >= visibleVariations.length) {
      setActiveVarIndex(0);
    }
  }, [activeVarIndex, visibleVariations.length]);

  useEffect(() => {
    if (allowedTipos && allowedTipos.size > 0) {
      setActiveVarIndex(0);
    }
  }, [allowedTipos]);

  const activeVar = visibleVariations[activeVarIndex] ?? visibleVariations[0];

  // Resolver hex del color activo
  const resolvedHex = resolveColorHex(activeVar.colorName, activeVar.colorHex);
  const hasActiveColor = !!(activeVar.colorName || resolvedHex);

  const handleAddToCart = async () => {
    if (isAdding) return;
    if (!isLoggedIn) {
      window.location.href = `/${lang}/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!activeVar.variationId) return;
    setIsAdding(true);
    window.dispatchEvent(new CustomEvent('cart:loading', { detail: { active: true, source: 'add' } }));
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          purchased_entity_type: 'commerce_product_variation',
          purchased_entity_id: activeVar.variationId,
          quantity: 1,
          combine: true,
        }]),
      });
      if (!res.ok) throw new Error('Cart API error');
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { delta: 1 } }));
    } catch {}
    finally {
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('cart:loading', { detail: { active: false, source: 'add' } }));
    }
  };

  return (
    <article className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_var(--headline-alpha-12)]">
      
      {/* Overlay de enlace - incluir variación en la URL */}
      {href && (
        <a
          href={`${href}${activeVar.variationId ? `?var=${activeVar.variationId}` : ''}`}
          aria-label={product.title}
          className="absolute inset-0 z-10 rounded-xl"
        />
      )}

      {/* Contenedor de Imagen */}
      <div className="relative aspect-[4/5] overflow-hidden bg-blush shrink-0">
        {activeVar.thumbnail ? (
          <img
            src={activeVar.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--primary-blush-tint)]">
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

        {/* Badge de tipo: arriba derecha */}
        {activeVar.tipo && (() => {
          const tipoKey = `shop.filters.type.${activeVar.tipo}` as UiKey;
          const tipoLabel = (ui[lang] as Record<string, string>)[tipoKey] ?? activeVar.tipo;
          const canSwitchTipo = visibleVariations.some(
            (v, i) => i !== activeVarIndex && v.tipo && v.tipo !== activeVar.tipo,
          );
          return (
            <span
              className={`absolute top-3 right-3 px-2.5 py-1 font-body text-[0.6875rem] font-bold uppercase tracking-widest bg-sage-light border border-sage/25 text-[var(--sage-headline-tint)] rounded-full shadow-sm z-10 ${
                canSwitchTipo ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={canSwitchTipo ? (lang === 'es' ? 'Cambiar tipo' : 'Switch type') : undefined}
              onClick={(e) => {
                if (!canSwitchTipo) return;
                e.preventDefault();
                e.stopPropagation();
                // Buscar la siguiente variación con tipo diferente
                const nextIdx = visibleVariations.findIndex(
                  (v, i) => i !== activeVarIndex && v.tipo && v.tipo !== activeVar.tipo,
                );
                if (nextIdx !== -1) setActiveVarIndex(nextIdx);
              }}
            >
              {tipoLabel}
            </span>
          );
        })()}

        {/* Tag */}
        {product.tag && (
          <span
            className={`absolute left-3 px-2.5 py-1 font-body text-[0.6875rem] font-bold uppercase tracking-widest bg-amber-200/92 text-amber-900 rounded-full shadow-sm ${
              product.badge ? 'top-12' : 'top-3'
            }`}
          >
            {product.tag}
          </span>
        )}

        {/* Bolitas de colores: todas las variaciones, abajo izquierda */}
        {visibleVariations.length > 0 && visibleVariations.some(v => v.colorName || v.colorHex) && (
          <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap max-w-[calc(100%-1.5rem)] z-10">
            {visibleVariations.map((v, idx) => {
              const hex = resolveColorHex(v.colorName, v.colorHex);
              if (!hex && !v.colorName) return null;
              const dotFill = hex || 'var(--muted)';
              const isActive = idx === activeVarIndex;
              return (
                <div
                  key={idx}
                  title={v.colorName ?? undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveVarIndex(idx);
                  }}
                  className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'scale-125 shadow-[0_0_0_2px_white,0_0_0_3.5px_rgba(0,0,0,0.4)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{
                    background: dotFill,
                    border: `1.5px solid ${hex ? 'rgba(0,0,0,0.15)' : 'var(--border)'}`,
                  }}
                />
              );
            })}
          </div>
        )}
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
            {hasActiveColor ? (
              <>
                {product.price || t(lang, 'shop.price_on_request')}
                <div
                  className="absolute bottom-4 left-4 w-4.5 h-4.5 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-115"
                  title={activeVar.colorName ?? undefined}
                  style={{
                    background: resolvedHex || 'var(--muted)',
                    border: `2px solid ${resolvedHex ? 'rgba(0,0,0,0.15)' : 'var(--border)'}`,
                  }}
                />
              </>
            ) : (
              product.price || t(lang, 'shop.price_on_request')
            )}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="relative z-20 w-full h-10.5 bg-primary text-white rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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
              <span className="material-symbols-outlined !text-[1.125rem] leading-none">
                shopping_bag
              </span>
              {t(lang, 'shop.add_to_cart')}
            </>
          )}
        </button>
      </div>
    </article>
  );
}