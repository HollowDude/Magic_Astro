// src/components/shop/ShopClient.tsx
import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import ProductCard, { type ProductCardData } from './ProductCard';
import { ui, defaultLang } from '@/i18n/ui';
import type { Lang, UiKey } from '@/i18n/ui';

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

// ── Tipos exportados ──────────────────────────────────────────────────────────

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

// ── Constantes ────────────────────────────────────────────────────────────────

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'newest';

const ITEMS_PER_PAGE = 9;
const PRIMARY   = '#eb4763';
const HEADLINE  = '#6d5157';
const BODY      = '#89656b';
const MUTED     = '#ad808a';
const BLUSH     = '#fdeff1';
const BORDER    = '#f0e4e6';
const FONT      = "'Be Vietnam Pro', sans-serif";

// ── Helper: convierte un nombre de categoría en slug (igual que en shop.astro) ─

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
  lang, categories,
  selectedCat, selectedPrice, selectedColors, selectedTipos,
  availableColors, availableTipos, priceRanges,
  hasFilters,
  onCatChange, onPriceChange, onColorToggle, onTipoToggle, onClear,
}: SidebarProps) {
  const inputStyle: CSSProperties = {
    accentColor: PRIMARY,
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Categorías */}
      {categories.length > 0 && (
        <div>
          <h3 style={s.filterTitle}>{t(lang, 'shop.filters.categories')}</h3>
          <div style={s.filterList}>
            {categories.map(cat => (
              <label key={cat.id} style={s.filterLabel}>
                <input
                  type="radio"
                  name="shop-cat"
                  checked={selectedCat === cat.slug}
                  onChange={() => onCatChange(cat.slug)}
                  style={inputStyle}
                />
                <span style={s.filterText}>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Precio */}
      <div>
        <h3 style={s.filterTitle}>{t(lang, 'shop.filters.price')}</h3>
        <div style={s.filterList}>
          {priceRanges.map(range => (
            <label key={range.key} style={s.filterLabel}>
              <input
                type="radio"
                name="shop-price"
                checked={selectedPrice === range.key}
                onChange={() => onPriceChange(range.key)}
                style={inputStyle}
              />
              <span style={s.filterText}>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colores */}
      {availableColors.length > 0 && (
        <div>
          <h3 style={s.filterTitle}>{t(lang, 'shop.filters.colors')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {availableColors.map(({ name, hex }) => {
              const active = selectedColors.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={active}
                  onClick={() => onColorToggle(name)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '9999px',
                    background: hex || MUTED,
                    border: `2px solid ${active ? PRIMARY : 'rgba(0,0,0,0.1)'}`,
                    cursor: 'pointer',
                    boxShadow: active
                      ? `0 0 0 2px white, 0 0 0 4px ${PRIMARY}`
                      : '0 1px 3px rgba(0,0,0,0.1)',
                    transform: active ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tipo */}
      {availableTipos.length > 0 && (
        <div>
          <h3 style={s.filterTitle}>{t(lang, 'shop.filters.type')}</h3>
          <div style={s.filterList}>
            {availableTipos.map(tipo => {
              const tipoKey = `shop.filters.type.${tipo}` as UiKey;
              const label = (ui[lang] as Record<string, string>)[tipoKey] ?? tipo;
              return (
                <label key={tipo} style={s.filterLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTipos.has(tipo)}
                    onChange={() => onTipoToggle(tipo)}
                    style={{ ...inputStyle, borderRadius: '0.25rem' }}
                  />
                  <span style={s.filterText}>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Limpiar filtros */}
      {hasFilters && (
        <button onClick={onClear} type="button" style={s.clearBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', lineHeight: 1 }}>
            filter_list_off
          </span>
          {t(lang, 'shop.filters.clear')}
        </button>
      )}
    </div>
  );
}

// ── Paginación ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  lang: Lang;
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, lang, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const from = Math.max(2, page - 1);
    const to   = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginTop: '3rem' }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{ ...s.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
        aria-label={t(lang, 'shop.pagination.prev')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
          chevron_left
        </span>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            style={{ ...s.pageBtn, border: 'none', background: 'none', color: MUTED, cursor: 'default' }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...s.pageBtn,
              background: page === p ? PRIMARY : 'white',
              color: page === p ? 'white' : HEADLINE,
              fontWeight: page === p ? 700 : 500,
              borderColor: page === p ? PRIMARY : BORDER,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={{ ...s.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
        aria-label={t(lang, 'shop.pagination.next')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
          chevron_right
        </span>
      </button>
    </div>
  );
}

// ── ShopClient ────────────────────────────────────────────────────────────────

export default function ShopClient({ products, categories, lang, initialCat = '' }: Props) {

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

    // ── Filtro de categoría ──────────────────────────────────────────────────
    // Compara el slug de la categoría del producto directamente con selectedCat.
    // product.category contiene el nombre del taxonomy term; lo convertimos a slug
    // con la misma función que se usó al construir los ShopCategory en shop.astro.
    if (selectedCat) {
      result = result.filter(p => {
        if (!p.category) return false;
        return toSlug(p.category) === selectedCat;
      });
    }

    // ── Filtro de precio ─────────────────────────────────────────────────────
    if (selectedPrice) {
      const range = priceRanges.find(r => r.key === selectedPrice);
      if (range) {
        result = result.filter(p => p.priceNumber >= range.min && p.priceNumber < range.max);
      }
    }

    // ── Filtro de color ──────────────────────────────────────────────────────
    if (selectedColors.size > 0) {
      result = result.filter(p => p.colorName && selectedColors.has(p.colorName));
    }

    // ── Filtro de tipo ───────────────────────────────────────────────────────
    if (selectedTipos.size > 0) {
      result = result.filter(p => p.tipo && selectedTipos.has(p.tipo));
    }

    // ── Ordenamiento ─────────────────────────────────────────────────────────
    switch (sortBy) {
      case 'price_asc':  result.sort((a, b) => a.priceNumber - b.priceNumber); break;
      case 'price_desc': result.sort((a, b) => b.priceNumber - a.priceNumber); break;
    }

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

  const sidebarProps: SidebarProps = {
    lang, categories,
    selectedCat, selectedPrice, selectedColors, selectedTipos,
    availableColors, availableTipos, priceRanges,
    hasFilters,
    onCatChange:   handleCatChange,
    onPriceChange: handlePriceChange,
    onColorToggle: toggleColor,
    onTipoToggle:  toggleTipo,
    onClear:       clearFilters,
  };

  return (
    <>
      <div style={s.layout}>

        {/* Sidebar desktop */}
        <aside style={s.desktopSidebar} className="shop-desktop-sidebar">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Contenido principal */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Barra superior */}
          <div style={s.topBar}>
            <p style={s.resultsText}>
              {t(lang, 'shop.showing')}{' '}
              <strong style={{ color: HEADLINE }}>{paginated.length}</strong>{' '}
              {t(lang, 'shop.of')}{' '}
              <strong style={{ color: HEADLINE }}>{filtered.length}</strong>{' '}
              {t(lang, 'shop.results')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {/* Botón filtros (solo mobile) */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="shop-filter-toggle"
                style={{ ...s.filterToggleBtn, position: 'relative' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', lineHeight: 1 }}>
                  tune
                </span>
                {t(lang, 'shop.filters.toggle')}
                {hasFilters && <span style={s.filterDot} />}
              </button>

              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setSortOpen(v => !v)}
                  style={s.sortBtn}
                >
                  <span style={{ fontFamily: FONT, fontSize: '0.875rem', color: HEADLINE }}>
                    {t(lang, 'shop.sort.label')}{' '}
                    <strong style={{ fontWeight: 700 }}>{sortLabels[sortBy]}</strong>
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1, color: MUTED }}>
                    keyboard_arrow_down
                  </span>
                </button>

                {sortOpen && (
                  <>
                    <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                    <div style={s.sortDropdown}>
                      {(Object.keys(sortLabels) as SortKey[]).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setSortBy(key); setSortOpen(false); setPage(1); }}
                          style={{
                            ...s.sortOption,
                            color:      sortBy === key ? PRIMARY  : HEADLINE,
                            fontWeight: sortBy === key ? 700      : 500,
                            background: sortBy === key ? `color-mix(in srgb, ${PRIMARY} 6%, white)` : 'transparent',
                          }}
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

          {/* Grid de productos */}
          {paginated.length === 0 ? (
            <div style={s.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: MUTED, opacity: 0.4 }}>
                search_off
              </span>
              <p style={{ fontFamily: FONT, color: BODY, fontSize: '1rem', marginTop: '1rem', marginBottom: 0 }}>
                {t(lang, 'shop.no_products')}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} type="button" style={{ ...s.clearBtn, marginTop: '1rem', width: 'auto', paddingInline: '1.5rem' }}>
                  {t(lang, 'shop.filters.clear')}
                </button>
              )}
            </div>
          ) : (
            <div className="shop-grid">
              {paginated.map(product => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} lang={lang} onChange={setPage} />
        </div>
      </div>

      {/* Drawer mobile */}
      {filtersOpen && (
        <>
          <div onClick={() => setFiltersOpen(false)} style={s.drawerOverlay} />
          <aside style={s.mobileDrawer}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexShrink: 0 }}>
              <h2 style={{ fontFamily: FONT, fontSize: '1.125rem', fontWeight: 700, color: HEADLINE, margin: 0 }}>
                {t(lang, 'shop.filters.toggle')}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: HEADLINE, padding: '0.25rem', display: 'flex' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', lineHeight: 1 }}>close</span>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
              <SidebarContent {...sidebarProps} />
            </div>
            <button type="button" onClick={() => setFiltersOpen(false)} style={s.applyBtn}>
              {t(lang, 'shop.filters.apply')} ({filtered.length})
            </button>
          </aside>
        </>
      )}

      <style>{`
        .shop-desktop-sidebar { display: none !important; }
        .shop-filter-toggle   { display: flex !important; }
        .shop-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 540px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .shop-desktop-sidebar { display: block !important; }
          .shop-filter-toggle   { display: none !important; }
          .shop-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        }
      `}</style>
    </>
  );
}

// ── Estilos estáticos ─────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2.5rem',
  },
  desktopSidebar: {
    width: '15rem',
    flexShrink: 0,
    position: 'sticky',
    top: '5rem',
  },
  filterTitle: {
    fontFamily: FONT,
    fontSize: '0.875rem',
    fontWeight: 700,
    color: HEADLINE,
    margin: 0,
    paddingBottom: '0.625rem',
    borderBottom: `1px solid ${BORDER}`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  filterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.75rem',
  } as CSSProperties,
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    cursor: 'pointer',
  } as CSSProperties,
  filterText: {
    fontFamily: FONT,
    fontSize: '0.875rem',
    color: BODY,
  } as CSSProperties,
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    width: '100%',
    padding: '0.5rem',
    background: 'none',
    border: `1px solid ${BORDER}`,
    borderRadius: '0.5rem',
    fontFamily: FONT,
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: MUTED,
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  resultsText: {
    fontFamily: FONT,
    fontSize: '0.875rem',
    color: BODY,
    margin: 0,
  },
  filterToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.875rem',
    background: BLUSH,
    border: `1px solid ${BORDER}`,
    borderRadius: '0.5rem',
    fontFamily: FONT,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: HEADLINE,
    cursor: 'pointer',
  },
  filterDot: {
    position: 'absolute',
    top: '-0.3rem',
    right: '-0.3rem',
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '9999px',
    background: PRIMARY,
    border: '2px solid white',
  },
  sortBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    background: 'white',
    border: `1px solid ${BORDER}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    whiteSpace: 'nowrap',
  },
  sortDropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 0.375rem)',
    background: 'white',
    border: `1px solid ${BORDER}`,
    borderRadius: '0.625rem',
    boxShadow: '0 8px 32px rgba(109,81,87,0.12)',
    zIndex: 10,
    overflow: 'hidden',
    minWidth: '12rem',
  },
  sortOption: {
    display: 'block',
    width: '100%',
    padding: '0.625rem 1rem',
    background: 'transparent',
    border: 'none',
    fontFamily: FONT,
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s, color 0.15s',
  } as CSSProperties,
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 1rem',
    textAlign: 'center',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.5rem',
    border: `1px solid ${BORDER}`,
    background: 'white',
    fontFamily: FONT,
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: HEADLINE,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  },
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(33,17,20,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 40,
  },
  mobileDrawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '18rem',
    background: 'white',
    zIndex: 50,
    padding: '1.5rem',
    boxShadow: '-4px 0 32px rgba(33,17,20,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    overflowY: 'hidden',
  },
  applyBtn: {
    marginTop: '1.25rem',
    width: '100%',
    height: '2.875rem',
    background: PRIMARY,
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontFamily: FONT,
    fontSize: '0.9375rem',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
};