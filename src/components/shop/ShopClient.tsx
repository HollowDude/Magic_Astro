// src/components/shop/ShopClient.tsx
import { useState, useMemo, useEffect } from 'react';
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

// Exportado para que ShopContent.astro pueda validar el param de URL en SSR
export type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'newest';

interface Props {
  products:      ProductCardData[];
  categories:    ShopCategory[];
  lang:          Lang;
  // Todos los parámetros iniciales vienen del SSR (leídos desde la URL por ShopContent.astro)
  initialCat?:    string;
  initialPrice?:  string;
  initialColors?: string; // comma-separated
  initialTipos?:  string; // comma-separated
  initialSort?:   SortKey;
  initialPage?:   number;
}

const ITEMS_PER_PAGE = 9;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

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
  const radioClass    = "w-4 h-4 accent-primary cursor-pointer shrink-0";
  const labelClass    = "flex items-center gap-2.5 cursor-pointer group";
  const textClass     = "font-body text-sm text-body-color group-hover:text-primary transition-colors";
  const titleClass    = "font-body text-[13px] font-bold text-headline pb-2.5 border-b border-border uppercase tracking-widest mb-3";

  return (
    <div className="flex flex-col gap-7">
      {categories.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.categories')}</h3>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <label key={cat.id} className={labelClass}>
                <input type="radio" name="shop-cat" checked={selectedCat === cat.slug}
                  onChange={() => onCatChange(cat.slug)} className={radioClass} />
                <span className={textClass}>{cat.name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className={titleClass}>{t(lang, 'shop.filters.price')}</h3>
        <div className="flex flex-col gap-2">
          {priceRanges.map(range => (
            <label key={range.key} className={labelClass}>
              <input type="radio" name="shop-price" checked={selectedPrice === range.key}
                onChange={() => onPriceChange(range.key)} className={radioClass} />
              <span className={textClass}>{range.label}</span>
            </label>
          ))}
        </div>
      </section>

      {availableColors.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.colors')}</h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {availableColors.map(({ name, hex }) => {
              const active = selectedColors.has(name);
              return (
                <button key={name} type="button" title={name}
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

      {availableTipos.length > 0 && (
        <section>
          <h3 className={titleClass}>{t(lang, 'shop.filters.type')}</h3>
          <div className="flex flex-col gap-2">
            {availableTipos.map(tipo => {
              const tipoKey = `shop.filters.type.${tipo}` as UiKey;
              const label   = (ui[lang] as Record<string, string>)[tipoKey] ?? tipo;
              return (
                <label key={tipo} className={labelClass}>
                  <input type="checkbox" checked={selectedTipos.has(tipo)}
                    onChange={() => onTipoToggle(tipo)} className={checkboxClass} />
                  <span className={textClass}>{label}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {hasFilters && (
        <button onClick={onClear} type="button"
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

export default function ShopClient({
  products, categories, lang,
  initialCat    = '',
  initialPrice  = '',
  initialColors = '',
  initialTipos  = '',
  initialSort   = 'featured',
  initialPage   = 1,
}: Props) {
  const priceRanges = useMemo(() => [
    { key: 'under50',  label: t(lang, 'shop.filters.price.under50'),  min: 0,   max: 50       },
    { key: '50_100',   label: t(lang, 'shop.filters.price.50_100'),   min: 50,  max: 100      },
    { key: '100_200',  label: t(lang, 'shop.filters.price.100_200'),  min: 100, max: 200      },
    { key: 'over200',  label: t(lang, 'shop.filters.price.over200'),  min: 200, max: Infinity },
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

  // Estado inicializado desde props SSR (que a su vez vienen de la URL)
  const [selectedCat,    setSelectedCat]    = useState<string>(initialCat);
  const [selectedPrice,  setSelectedPrice]  = useState<string>(initialPrice);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(
    () => new Set(initialColors.split(',').filter(Boolean)),
  );
  const [selectedTipos,  setSelectedTipos]  = useState<Set<string>>(
    () => new Set(initialTipos.split(',').filter(Boolean)),
  );
  const [sortBy,         setSortBy]         = useState<SortKey>(initialSort);
  const [page,           setPage]           = useState(initialPage);
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [sortOpen,       setSortOpen]       = useState(false);

  // ── Sincronizar URL cuando cambia el estado ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCat)           params.set('cat',    selectedCat);
    if (selectedPrice)         params.set('price',  selectedPrice);
    if (selectedColors.size > 0) params.set('colors', Array.from(selectedColors).join(','));
    if (selectedTipos.size > 0)  params.set('tipos',  Array.from(selectedTipos).join(','));
    if (sortBy !== 'featured') params.set('sort',   sortBy);
    if (page > 1)              params.set('page',   String(page));

    const search = params.toString();
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname;

    window.history.replaceState(null, '', newUrl);
  }, [selectedCat, selectedPrice, selectedColors, selectedTipos, sortBy, page]);

  // ── Restaurar estado al navegar con el botón atrás/adelante ────────────────
  useEffect(() => {
    const handlePop = () => {
      const sp = new URLSearchParams(window.location.search);
      setSelectedCat(sp.get('cat')    ?? '');
      setSelectedPrice(sp.get('price') ?? '');
      setSelectedColors(new Set(sp.get('colors')?.split(',').filter(Boolean) ?? []));
      setSelectedTipos(new Set(sp.get('tipos')?.split(',').filter(Boolean)   ?? []));
      const rawSort = sp.get('sort') as SortKey | null;
      setSortBy(rawSort ?? 'featured');
      setPage(Math.max(1, parseInt(sp.get('page') ?? '1', 10)));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const hasFilters = !!(selectedCat || selectedPrice || selectedColors.size > 0 || selectedTipos.size > 0);

  function clearFilters() {
    setSelectedCat(''); setSelectedPrice('');
    setSelectedColors(new Set()); setSelectedTipos(new Set());
    setPage(1);
  }
  function handleCatChange(slug: string)  { setSelectedCat(prev => prev === slug ? '' : slug); setPage(1); }
  function handlePriceChange(key: string) { setSelectedPrice(prev => prev === key ? '' : key);  setPage(1); }
  function toggleColor(name: string) {
    setSelectedColors(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
    setPage(1);
  }
  function toggleTipo(tipo: string) {
    setSelectedTipos(prev => { const n = new Set(prev); n.has(tipo) ? n.delete(tipo) : n.add(tipo); return n; });
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCat)   result = result.filter(p => p.category && toSlug(p.category) === selectedCat);
    if (selectedPrice) {
      const range = priceRanges.find(r => r.key === selectedPrice);
      if (range) result = result.filter(p => p.priceNumber >= range.min && p.priceNumber < range.max);
    }
    if (selectedColors.size > 0) result = result.filter(p => p.colorName && selectedColors.has(p.colorName));
    if (selectedTipos.size > 0)  result = result.filter(p => p.tipo      && selectedTipos.has(p.tipo));
    if (sortBy === 'price_asc')  result.sort((a, b) => a.priceNumber - b.priceNumber);
    if (sortBy === 'price_desc') result.sort((a, b) => b.priceNumber - a.priceNumber);
    return result;
  }, [products, selectedCat, selectedPrice, selectedColors, selectedTipos, sortBy, priceRanges]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const sortLabels: Record<SortKey, string> = {
    featured:   t(lang, 'shop.sort.featured'),
    price_asc:  t(lang, 'shop.sort.price_asc'),
    price_desc: t(lang, 'shop.sort.price_desc'),
    newest:     t(lang, 'shop.sort.newest'),
  };

  const sidebarProps = {
    lang, categories, selectedCat, selectedPrice, selectedColors, selectedTipos,
    availableColors, availableTipos, priceRanges, hasFilters,
    onCatChange: handleCatChange, onPriceChange: handlePriceChange,
    onColorToggle: toggleColor,   onTipoToggle: toggleTipo,
    onClear: clearFilters,
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-10">

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-20">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="font-body text-sm text-body-color">
            {t(lang, 'shop.showing')} <strong className="text-headline">{paginated.length}</strong>{' '}
            {t(lang, 'shop.of')} <strong className="text-headline">{filtered.length}</strong>{' '}
            {t(lang, 'shop.results')}
          </p>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setFiltersOpen(true)}
              className="lg:hidden relative flex items-center gap-1.5 px-3.5 py-2 bg-blush border border-border rounded-lg font-body text-sm font-semibold text-headline cursor-pointer"
            >
              <span className="material-symbols-outlined !text-[18px]">tune</span>
              {t(lang, 'shop.filters.toggle')}
              {hasFilters && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border-2 border-white" />}
            </button>

            <div className="relative">
              <button onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-border rounded-lg cursor-pointer hover:border-primary transition-colors whitespace-nowrap"
              >
                <span className="font-body text-sm text-headline">
                  {t(lang, 'shop.sort.label')} <strong>{sortLabels[sortBy]}</strong>
                </span>
                <span className="material-symbols-outlined text-[20px] text-muted">keyboard_arrow_down</span>
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-white border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    {(Object.keys(sortLabels) as SortKey[]).map(key => (
                      <button key={key}
                        onClick={() => { setSortBy(key); setSortOpen(false); setPage(1); }}
                        className={`block w-full px-4 py-2.5 text-left font-body text-sm transition-colors ${
                          sortBy === key ? 'text-primary font-bold bg-primary/5' : 'text-headline font-medium hover:bg-gray-50'
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
              <button onClick={clearFilters}
                className="mt-4 px-6 py-2 border border-border rounded-lg font-body text-[13px] font-semibold text-muted hover:text-primary hover:border-primary cursor-pointer"
              >
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
              <SidebarContent {...sidebarProps} />
            </div>
            <button onClick={() => setFiltersOpen(false)}
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

// ── Paginación ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, lang, onChange }: {
  page: number; totalPages: number; lang: Lang; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnClass = "flex items-center justify-center w-10 h-10 rounded-lg border font-body text-sm transition-all duration-150 cursor-pointer";

  return (
    <nav className="flex justify-center gap-1.5 mt-12">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className={`${btnClass} border-border text-headline disabled:opacity-40`}
      >
        <span className="material-symbols-outlined !text-xl">chevron_left</span>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={i} className="flex items-center justify-center w-10 h-10 font-body text-muted">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`${btnClass} ${
              page === p ? 'bg-primary border-primary text-white font-bold' : 'bg-white border-border text-headline font-medium hover:border-primary'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className={`${btnClass} border-border text-headline disabled:opacity-40`}
      >
        <span className="material-symbols-outlined !text-xl">chevron_right</span>
      </button>
    </nav>
  );
}