// src/components/shop/ShopClient.tsx
import { useState, useMemo } from 'react';
import ProductCard, { type ProductCardData } from './ProductCard';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  products: ProductCardData[];
  categories: ShopCategory[];
  lang: Lang;
  initialCat?: string;
}

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'newest';
const ITEMS_PER_PAGE = 9;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ── Componente Sidebar (Reutilizable) ─────────────────────────────────────────

interface SidebarProps {
  lang: Lang;
  categories: ShopCategory[];
  selectedCat: string;
  selectedPrice: string;
  selectedColors: Set<string>;
  selectedTipos: Set<string>;
  availableColors: { name: string; hex: string }[];
  availableTipos: string[];
  priceRanges: { key: string; label: string }[];
  hasFilters: boolean;
  onCatChange: (slug: string) => void;
  onPriceChange: (key: string) => void;
  onColorToggle: (name: string) => void;
  onTipoToggle: (tipo: string) => void;
  onClear: () => void;
}

function SidebarContent({
  lang, categories, selectedCat, selectedPrice, selectedColors, selectedTipos,
  availableColors, availableTipos, priceRanges, hasFilters,
  onCatChange, onPriceChange, onColorToggle, onTipoToggle, onClear,
}: SidebarProps) {
  
  const checkboxClass = "w-4 h-4 accent-primary cursor-pointer shrink-0 rounded-[0.25rem]";
  const radioClass = "w-4 h-4 accent-primary cursor-pointer shrink-0";
  const labelClass = "flex items-center gap-2.5 cursor-pointer group";
  const textClass = "font-body text-sm text-body-color group-hover:text-primary transition-colors";
  const titleClass = "font-body text-[13px] font-bold text-headline pb-2.5 border-b border-border uppercase tracking-widest mb-3";

  return (
    <div className="flex flex-col gap-7">
      {/* Categorías */}
      {categories.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.categories')}</h3>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <label key={cat.id} className={labelClass}>
                <input
                  type="radio"
                  name="shop-cat"
                  checked={selectedCat === cat.slug}
                  onChange={() => onCatChange(cat.slug)}
                  className={radioClass}
                />
                <span className={textClass}>{cat.name}</span>
              </label>
            ))}
          </div>
        </section> )}

      {/* Precio */}
      <section>
        <h3 className={titleClass}>{t(lang, 'shop.filters.price')}</h3>
        <div className="flex flex-col gap-2">
          {priceRanges.map(range => (
            <label key={range.key} className={labelClass}>
              <input
                type="radio"
                name="shop-price"
                checked={selectedPrice === range.key}
                onChange={() => onPriceChange(range.key)}
                className={radioClass}
              />
              <span className={textClass}>{range.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Colores */}
      {availableColors.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.colors')}</h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {availableColors.map(({ name, hex }) => {
              const active = selectedColors.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => onColorToggle(name)}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-150 cursor-pointer ${
                    active 
                      ? 'border-primary scale-115 shadow-[0_0_0_2px_white,0_0_0_4px_var(--primary)]' 
                      : 'border-black/10 shadow-sm'
                  }`}
                  style={{ background: hex || 'var(--muted)' }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Tipo */}
      {availableTipos.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.type')}</h3>
          <div className="flex flex-col gap-2">
            {availableTipos.map(tipo => {
              const tipoKey = `shop.filters.type.${tipo}` as UiKey;
              const label = (ui[lang] as Record<string, string>)[tipoKey] ?? tipo;
              return (
                <label key={tipo} className={labelClass}>
                  <input
                    type="checkbox"
                    checked={selectedTipos.has(tipo)}
                    onChange={() => onTipoToggle(tipo)}
                    className={checkboxClass}
                  />
                  <span className={textClass}>{label}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Limpiar */}
      {hasFilters && (
        <button 
          onClick={onClear} 
          type="button" 
          className="flex items-center justify-center gap-1.5 w-full p-2 bg-transparent border border-border rounded-lg font-body text-[13px] font-semibold text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined !text-base">filter_list_off</span>
          {t(lang, 'shop.filters.clear')}
        </button>
      )}
    </div>
  );
}

// ── ShopClient ────────────────────────────────────────────────────────────────

export default function ShopClient({ products, categories, lang, initialCat = '' }: Props) {
  // ... (useMemo logic and handlers remain identical to your original code)
  const priceRanges = useMemo(() => [
    { key: 'under50',  label: t(lang, 'shop.filters.price.under50'),  min: 0,   max: 50        },
    { key: '50_100',   label: t(lang, 'shop.filters.price.50_100'),   min: 50,  max: 100       },
    { key: '100_200',  label: t(lang, 'shop.filters.price.100_200'),  min: 100, max: 200       },
    { key: 'over200',  label: t(lang, 'shop.filters.price.over200'),  min: 200, max: Infinity  },
  ], [lang]);

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => { if (p.colorName) map.set(p.colorName, p.colorHex ?? ''); });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const availableTipos = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.tipo) set.add(p.tipo); });
    return Array.from(set);
  }, [products]);

  const [selectedCat,    setSelectedCat]    = useState<string>(initialCat);
  const [selectedPrice,  setSelectedPrice]  = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedTipos,  setSelectedTipos]  = useState<Set<string>>(new Set());
  const [sortBy,         setSortBy]         = useState<SortKey>('featured');
  const [page,           setPage]           = useState(1);
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [sortOpen,       setSortOpen]       = useState(false);

  const hasFilters = !!(selectedCat || selectedPrice || selectedColors.size > 0 || selectedTipos.size > 0);

  function clearFilters() {
    setSelectedCat('');
    setSelectedPrice('');
    setSelectedColors(new Set());
    setSelectedTipos(new Set());
    setPage(1);
  }

  function handleCatChange(slug: string) {
    setSelectedCat(prev => prev === slug ? '' : slug);
    setPage(1);
  }

  function handlePriceChange(key: string) {
    setSelectedPrice(prev => prev === key ? '' : key);
    setPage(1);
  }

  function toggleColor(name: string) {
    setSelectedColors(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    setPage(1);
  }

  function toggleTipo(tipo: string) {
    setSelectedTipos(prev => {
      const next = new Set(prev);
      next.has(tipo) ? next.delete(tipo) : next.add(tipo);
      return next;
    });
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCat) result = result.filter(p => p.category && toSlug(p.category) === selectedCat);
    if (selectedPrice) {
      const range = priceRanges.find(r => r.key === selectedPrice);
      if (range) result = result.filter(p => p.priceNumber >= range.min && p.priceNumber < range.max);
    }
    if (selectedColors.size > 0) result = result.filter(p => p.colorName && selectedColors.has(p.colorName));
    if (selectedTipos.size > 0) result = result.filter(p => p.tipo && selectedTipos.has(p.tipo));

    switch (sortBy) {
      case 'price_asc':  result.sort((a, b) => a.priceNumber - b.priceNumber); break;
      case 'price_desc': result.sort((a, b) => b.priceNumber - a.priceNumber); break;
    }
    return result;
  }, [products, selectedCat, selectedPrice, selectedColors, selectedTipos, sortBy, priceRanges]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const sortLabels: Record<SortKey, string> = {
    featured: t(lang, 'shop.sort.featured'),
    price_asc: t(lang, 'shop.sort.price_asc'),
    price_desc: t(lang, 'shop.sort.price_desc'),
    newest: t(lang, 'shop.sort.newest'),
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-10">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-20">
        <SidebarContent 
          lang={lang} categories={categories} selectedCat={selectedCat} 
          selectedPrice={selectedPrice} selectedColors={selectedColors} 
          selectedTipos={selectedTipos} availableColors={availableColors} 
          availableTipos={availableTipos} priceRanges={priceRanges} 
          hasFilters={hasFilters} onCatChange={handleCatChange} 
          onPriceChange={handlePriceChange} onColorToggle={toggleColor} 
          onTipoToggle={toggleTipo} onClear={clearFilters}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">
        
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="font-body text-sm text-body-color">
            {t(lang, 'shop.showing')} <strong className="text-headline">{paginated.length}</strong> {t(lang, 'shop.of')} <strong className="text-headline">{filtered.length}</strong> {t(lang, 'shop.results')}
          </p>

          <div className="flex items-center gap-2.5">
            {/* Toggle Filtros (Mobile) */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden relative flex items-center gap-1.5 px-3.5 py-2 bg-blush border border-border rounded-lg font-body text-sm font-semibold text-headline cursor-pointer"
            >
              <span className="material-symbols-outlined !text-[18px]">tune</span>
              {t(lang, 'shop.filters.toggle')}
              {hasFilters && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border-2 border-white" />}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-border rounded-lg cursor-pointer hover:border-primary transition-colors whitespace-nowrap"
              >
                <span className="font-body text-sm text-headline">
                  {t(lang, 'shop.sort.label')} <strong className="font-bold">{sortLabels[sortBy]}</strong>
                </span>
                <span className="material-symbols-outlined text-[20px] text-muted">keyboard_arrow_down</span>
              </button>

              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-white border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    {(Object.keys(sortLabels) as SortKey[]).map(key => (
                      <button
                        key={key}
                        onClick={() => { setSortBy(key); setSortOpen(false); setPage(1); }}
                        className={`block w-full px-4 py-2.5 text-left font-body text-sm transition-colors ${
                          sortBy === key 
                            ? 'text-primary font-bold bg-primary/5' 
                            : 'text-headline font-medium hover:bg-gray-50'
                        }`}
                      >
                        {sortLabels[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grid / Empty State */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-[3.5rem] text-muted opacity-40">search_off</span>
            <p className="font-body text-body-color text-base mt-4">{t(lang, 'shop.no_products')}</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 px-6 py-2 border border-border rounded-lg font-body text-[13px] font-semibold text-muted hover:text-primary hover:border-primary cursor-pointer">
                {t(lang, 'shop.filters.clear')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {paginated.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                href={lang === 'en' ? `/en/${product.id}` : `/${product.id}`}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        <Pagination page={page} totalPages={totalPages} lang={lang} onChange={setPage} />
      </div>

      {/* Drawer Móvil */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 bg-headline/45 backdrop-blur-sm z-40" onClick={() => setFiltersOpen(false)} />
          <aside className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="font-body text-lg font-bold text-headline">{t(lang, 'shop.filters.toggle')}</h2>
              <button onClick={() => setFiltersOpen(false)} className="text-headline p-1 flex cursor-pointer">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <SidebarContent 
                lang={lang} categories={categories} selectedCat={selectedCat} 
                selectedPrice={selectedPrice} selectedColors={selectedColors} 
                selectedTipos={selectedTipos} availableColors={availableColors} 
                availableTipos={availableTipos} priceRanges={priceRanges} 
                hasFilters={hasFilters} onCatChange={handleCatChange} 
                onPriceChange={handlePriceChange} onColorToggle={toggleColor} 
                onTipoToggle={toggleTipo} onClear={clearFilters}
              />
            </div>
            <button 
              onClick={() => setFiltersOpen(false)} 
              className="mt-5 w-full h-12 bg-primary text-white rounded-lg font-body text-[15px] font-bold cursor-pointer"
            >
              {t(lang, 'shop.filters.apply')} ({filtered.length})
            </button>
          </aside>
        </>
      )}
    </div>
  );
}

// ── Paginación (Refactorizada) ────────────────────────────────────────────────

function Pagination({ page, totalPages, lang, onChange }: { page: number; totalPages: number; lang: Lang; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); } 
  else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnClass = "flex items-center justify-center w-10 h-10 rounded-lg border font-body text-sm transition-all duration-150 cursor-pointer";

  return (
    <nav className="flex justify-center gap-1.5 mt-12">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`${btnClass} border-border text-headline disabled:opacity-40`}
      >
        <span className="material-symbols-outlined !text-xl">chevron_left</span>
      </button>

      {pages.map((p, i) => (
        p === '...' ? (
          <span key={i} className="flex items-center justify-center w-10 h-10 font-body text-muted">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btnClass} ${
              page === p 
                ? 'bg-primary border-primary text-white font-bold' 
                : 'bg-white border-border text-headline font-medium hover:border-primary'
            }`}
          >
            {p}
          </button>
        )
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={`${btnClass} border-border text-headline disabled:opacity-40`}
      >
        <span className="material-symbols-outlined !text-xl">chevron_right</span>
      </button>
    </nav>
  );
}