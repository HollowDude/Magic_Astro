// src/components/home/HeaderClient.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { ui, defaultLang, languages } from '@/i18n/ui';
import { getLocalizedPath, getNavLinks } from '@/i18n/utils';
import type { Lang, UiKey } from '@/i18n/ui';
import { Fragment } from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  price: string;
  thumbnail: string | null;
}

interface Props {
  isLoggedIn:  boolean;
  currentPath: string;
  lang:        Lang;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

const PRIMARY   = '#eb4763';
const ICON_SIZE = '2.375rem';
const PILL_OPEN = '13.5rem';

// ── Textos inline (evita tocar ui.ts) ────────────────────────────────────────
const SEARCH_STRINGS = {
  es: {
    loading:   'Buscando...',
    noResults: 'Sin resultados para',
    showMore:  'Ver más en la tienda →',
    from:      'desde',
    priceNA:   'Consultar precio',
  },
  en: {
    loading:   'Searching...',
    noResults: 'No results for',
    showMore:  'See more in the shop →',
    from:      'from',
    priceNA:   'Price on request',
  },
} as const;

const DEBOUNCE_MS = 350;

// ── Componente SearchResultPanel ──────────────────────────────────────────────

interface SearchPanelProps {
  lang:        Lang;
  query:       string;
  results:     SearchResult[];
  loading:     boolean;
  hasMore:     boolean;
  shopHref:    string;
}

function SearchResultPanel({
  lang, query, results, loading, hasMore, shopHref,
}: SearchPanelProps) {
  const ss = SEARCH_STRINGS[lang];

  return (
    <div style={sp.panel}>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={sp.skeleton}>
              <div style={sp.skeletonImg} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ ...sp.skeletonLine, width: '70%' }} />
                <div style={{ ...sp.skeletonLine, width: '35%', opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && results.length === 0 && (
        <div style={sp.empty}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: PRIMARY, opacity: 0.4, lineHeight: 1 }}
          >
            search_off
          </span>
          <p style={sp.emptyText}>
            {ss.noResults} <strong style={{ color: '#6d5157' }}>"{query}"</strong>
          </p>
        </div>
      )}

      {/* Resultados */}
      {!loading && results.length > 0 && (
        <>
          <ul style={sp.list} role="listbox" aria-label={`Resultados para ${query}`}>
            {results.map((r) => (
              <li key={r.id} style={{ listStyle: 'none' }}>
                <a
                  href={`${lang === 'en' ? '/en' : ''}/shop`}
                  style={sp.item}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(235,71,99,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={sp.thumb}>
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail}
                        alt={r.title}
                        style={sp.thumbImg}
                        loading="lazy"
                      />
                    ) : (
                      <div style={sp.thumbPh}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '1.25rem', color: PRIMARY, opacity: 0.4, lineHeight: 1 }}
                        >
                          local_florist
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={sp.itemInfo}>
                    <p style={sp.itemTitle}>{r.title}</p>
                    <p style={sp.itemPrice}>
                      {r.price
                        ? `${ss.from} ${r.price}`
                        : ss.priceNA}
                    </p>
                  </div>

                  {/* Chevron */}
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '1rem', color: '#ad808a', opacity: 0.5, lineHeight: 1, flexShrink: 0 }}
                  >
                    chevron_right
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Mostrar más */}
          {hasMore && (
            <div style={sp.footer}>
              <a href={shopHref} style={sp.showMore}>
                {ss.showMore}
              </a>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}

// Estilos del panel
const sp: Record<string, React.CSSProperties> = {
  panel: {
    position:     'absolute',
    top:          'calc(100% + 0.5rem)',
    left:         0,
    right:        0,
    minWidth:     '18rem',
    background:   'white',
    borderRadius: '0.875rem',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(235,71,99,0.08)',
    zIndex:       100,
    overflow:     'hidden',
    padding:      '0.75rem 0',
  },
  list: {
    margin:  0,
    padding: 0,
  },
  item: {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.75rem',
    padding:        '0.5rem 1rem',
    textDecoration: 'none',
    color:          'inherit',
    transition:     'background 0.15s',
    cursor:         'pointer',
  },
  thumb: {
    width:        '2.75rem',
    height:       '2.75rem',
    borderRadius: '0.5rem',
    overflow:     'hidden',
    flexShrink:   0,
    background:   '#fdeff1',
  },
  thumbImg: {
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
    display:    'block',
  },
  thumbPh: {
    width:           '100%',
    height:          '100%',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemInfo: {
    flex:     1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily:   "'Be Vietnam Pro', sans-serif",
    fontSize:     '0.875rem',
    fontWeight:   600,
    color:        '#6d5157',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  itemPrice: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:   '0.75rem',
    color:      '#ad808a',
    margin:     0,
    marginTop:  '0.15rem',
  },
  footer: {
    borderTop: '1px solid #f0e4e6',
    marginTop: '0.375rem',
    paddingTop: '0.375rem',
    padding:   '0.5rem 1rem 0.125rem',
  },
  showMore: {
    display:        'block',
    fontFamily:     "'Be Vietnam Pro', sans-serif",
    fontSize:       '0.8125rem',
    fontWeight:     700,
    color:          PRIMARY,
    textDecoration: 'none',
    textAlign:      'center' as const,
    padding:        '0.375rem 0',
    borderRadius:   '0.5rem',
    transition:     'background 0.15s',
  },
  // Skeletons
  skeleton: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.75rem',
    padding:    '0.5rem 1rem',
  },
  skeletonImg: {
    width:        '2.75rem',
    height:       '2.75rem',
    borderRadius: '0.5rem',
    flexShrink:   0,
    background:   'linear-gradient(90deg, #f0e4e6 25%, #fdeff1 50%, #f0e4e6 75%)',
    backgroundSize: '200% 100%',
    animation:    'shimmer 1.4s ease-in-out infinite',
  },
  skeletonLine: {
    height:       '0.625rem',
    borderRadius: '9999px',
    background:   'linear-gradient(90deg, #f0e4e6 25%, #fdeff1 50%, #f0e4e6 75%)',
    backgroundSize: '200% 100%',
    animation:    'shimmer 1.4s ease-in-out infinite',
  },
  empty: {
    display:        'flex',
    flexDirection:  'column' as const,
    alignItems:     'center',
    gap:            '0.5rem',
    padding:        '1.25rem 1rem',
    textAlign:      'center' as const,
  },
  emptyText: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:   '0.875rem',
    color:      '#89656b',
    margin:     0,
  },
};

// ── HeaderClient ──────────────────────────────────────────────────────────────

export default function HeaderClient({ isLoggedIn, currentPath, lang }: Props) {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchValue,   setSearchValue]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore,       setHasMore]       = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const pillRef     = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navLinks = getNavLinks(lang);
  const shopHref = lang === 'en' ? '/en/shop' : '/shop';

  // ── Search open/close ───────────────────────────────────────────────────────
  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 220);
  };

  const closeSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchOpen(false);
    setSearchValue('');
    setSearchResults([]);
    setSearchLoading(false);
    setHasMore(false);
    inputRef.current?.blur();
  }, []);

  // ── Cerrar al click fuera ───────────────────────────────────────────────────
  useEffect(() => {
    if (!searchOpen) return;
    const down = (e: MouseEvent) => {
      if (!pillRef.current?.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [searchOpen, closeSearch]);

  // ── Cerrar con Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [closeSearch]);

  // ── Búsqueda con debounce ───────────────────────────────────────────────────
  useEffect(() => {
    // Limpiar si menos de 3 caracteres
    if (searchValue.length < 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSearchResults([]);
      setSearchLoading(false);
      setHasMore(false);
      return;
    }

    // Mostrar loading inmediato para feedback visual rápido
    setSearchLoading(true);

    // Cancelar petición anterior y programar nueva
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `/api/search?q=${encodeURIComponent(searchValue)}&lang=${lang}`,
        );
        const data = await res.json() as { results: SearchResult[]; hasMore: boolean };
        setSearchResults(data.results ?? []);
        setHasMore(data.hasMore ?? false);
      } catch {
        setSearchResults([]);
        setHasMore(false);
      } finally {
        setSearchLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, lang]);

  const isActive = (href: string) =>
    currentPath === href || currentPath.startsWith(href + '/');

  const switchLang = (targetLang: Lang) => {
    if (targetLang === lang) return;
    window.location.href = getLocalizedPath(currentPath, targetLang);
  };

  // ¿Mostrar el panel de resultados?
  const showPanel = searchOpen && searchValue.length >= 3;

  return (
    <>
      <header style={s.header}>

        {/* ── Left: logo + nav ── */}
        <div style={s.left}>
          <a href={lang === 'es' ? '/' : '/en'} style={s.logo}>
            <span className="material-symbols-outlined" style={s.logoIcon}>local_florist</span>
            <span style={s.logoText}>Maggy Flowers</span>
          </a>

          <nav style={s.nav} className="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ ...s.navLink, ...(isActive(link.href) ? s.navLinkActive : {}) }}
              >
                {t(lang, link.key)}
                {isActive(link.href) && <span style={s.navDot} />}
              </a>
            ))}
          </nav>
        </div>

        {/* ── Right ── */}
        <div style={s.right}>

          {/* ── Search pill ── */}
          <div ref={pillRef} style={{ position: 'relative' }}>
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                height:       ICON_SIZE,
                width:        searchOpen ? PILL_OPEN : ICON_SIZE,
                borderRadius: '9999px',
                overflow:     'hidden',
                border:       `1.5px solid ${searchOpen ? 'rgba(235,71,99,0.28)' : 'transparent'}`,
                background:   searchOpen ? 'white' : 'rgba(235,71,99,0.07)',
                boxShadow:    searchOpen ? '0 4px 20px rgba(235,71,99,0.1)' : 'none',
                transition:   [
                  'width 0.38s cubic-bezier(0.4,0,0.2,1)',
                  'border-color 0.25s ease',
                  'background 0.25s ease',
                  'box-shadow 0.3s ease',
                ].join(', '),
              }}
            >
              <button
                onClick={searchOpen ? closeSearch : openSearch}
                aria-label={t(lang, searchOpen ? 'header.search.close' : 'header.search.open')}
                style={{
                  flexShrink:     0,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          ICON_SIZE,
                  height:         ICON_SIZE,
                  border:         'none',
                  background:     'transparent',
                  cursor:         'pointer',
                  color:          searchOpen ? PRIMARY : '#3a1a20',
                  transition:     'color 0.2s',
                  borderRadius:   '9999px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1, display: 'block' }}>
                  {/* Mostrar X solo si hay texto, sino lupa */}
                  {searchOpen && searchValue.length > 0 ? 'close' : 'search'}
                </span>
              </button>

              <input
                ref={inputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t(lang, 'header.search.placeholder')}
                aria-label={t(lang, 'header.search.open')}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                autoComplete="off"
                style={{
                  flex:          1,
                  minWidth:      0,
                  border:        'none',
                  background:    'transparent',
                  outline:       'none',
                  padding:       '0 1rem 0 0',
                  fontSize:      '0.875rem',
                  fontFamily:    "'Be Vietnam Pro', sans-serif",
                  color:         '#181112',
                  opacity:       searchOpen ? 1 : 0,
                  transform:     searchOpen ? 'translateX(0)' : 'translateX(-6px)',
                  pointerEvents: searchOpen ? 'auto' : 'none',
                  transition:    'opacity 0.22s ease 0.16s, transform 0.28s ease 0.12s',
                }}
              />

              {/* Spinner dentro de la pill mientras carga */}
              {searchLoading && (
                <div style={{
                  flexShrink:   0,
                  width:        '1rem',
                  height:       '1rem',
                  marginRight:  '0.75rem',
                  borderRadius: '9999px',
                  border:       `2px solid rgba(235,71,99,0.2)`,
                  borderTopColor: PRIMARY,
                  animation:    'spin 0.7s linear infinite',
                }} />
              )}
            </div>

            {/* Panel de resultados */}
            {showPanel && (
              <SearchResultPanel
                lang={lang}
                query={searchValue}
                results={searchResults}
                loading={searchLoading}
                hasMore={hasMore}
                shopHref={shopHref}
              />
            )}
          </div>

          {/* ── Selector de idioma ── */}
          <div style={s.langSelector} role="group" aria-label={t(lang, 'lang.select')}>
            {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
              <Fragment key={l}>
                <button
                  onClick={() => switchLang(l)}
                  disabled={l === lang}
                  aria-current={l === lang ? 'true' : undefined}
                  style={{
                    ...s.langBtn,
                    color:      l === lang ? PRIMARY : '#886369',
                    fontWeight: l === lang ? 700 : 500,
                    cursor:     l === lang ? 'default' : 'pointer',
                  }}
                >
                  {l.toUpperCase()}
                </button>
                {i < arr.length - 1 && (
                  <span key={`sep-${l}`} style={s.langDivider}>|</span>
                )}
              </Fragment>
            ))}
          </div>

          {/* ── Auth ── */}
          {isLoggedIn ? (
            <>
              <a href={lang === 'es' ? '/dashboard' : '/en/dashboard'} style={s.iconBtn} aria-label={t(lang, 'header.profile')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                  account_circle
                </span>
              </a>
              <button style={{ ...s.iconBtn, position: 'relative' }} aria-label={t(lang, 'header.cart')} disabled>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                  shopping_bag
                </span>
                <span style={s.badge}>0</span>
              </button>
            </>
          ) : (
            <button disabled style={s.loginBtn} title="Próximamente">
              {t(lang, 'header.login')}
            </button>
          )}

          {/* ── Hamburger (mobile) ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            style={s.hamburgerBtn}
            className="hamburger-btn"
            aria-label={t(lang, 'header.menu')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div style={s.overlay} onClick={() => setMobileOpen(false)}>
          <nav style={s.drawer} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ ...s.mobileLink, ...(isActive(link.href) ? s.mobileLinkActive : {}) }}
              >
                {t(lang, link.key)}
              </a>
            ))}

            <div style={s.mobileLangRow}>
              {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
                <Fragment key={l}>
                  <button
                    onClick={() => switchLang(l)}
                    disabled={l === lang}
                    style={{
                      ...s.mobileLangBtn,
                      color:      l === lang ? PRIMARY : '#886369',
                      fontWeight: l === lang ? 700 : 500,
                    }}
                  >
                    {languages[l]}
                  </button>
                  {i < arr.length - 1 && (
                    <span key={`msep-${l}`} style={{ color: '#d0c0c3', fontSize: '0.75rem' }}>|</span>
                  )}
                </Fragment>
              ))}
            </div>
          </nav>
        </div>
      )}

      <style>{`
        .desktop-nav   { display: flex; }
        .hamburger-btn { display: none !important; }

        @media (max-width: 767px) {
          .desktop-nav   { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  header: {
    position:           'sticky',
    top:                0,
    zIndex:             50,
    display:            'flex',
    alignItems:         'center',
    justifyContent:     'space-between',
    gap:                '1rem',
    padding:            '0.625rem 2.5rem',
    background:         'rgba(255,255,255,0.87)',
    backdropFilter:     'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom:       '1px solid rgba(235,71,99,0.1)',
  },
  left: {
    display:    'flex',
    alignItems: 'center',
    gap:        '2.5rem',
    minWidth:   0,
  },
  logo: {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.5rem',
    textDecoration: 'none',
    color:          '#181112',
    flexShrink:     0,
  },
  logoIcon: { fontSize: '1.875rem', color: PRIMARY, lineHeight: 1 },
  logoText: {
    fontSize:      '1.0625rem',
    fontWeight:    800,
    letterSpacing: '-0.02em',
    fontFamily:    "'Be Vietnam Pro', sans-serif",
  },
  nav: {
    alignItems: 'center',
    gap:        '1.875rem',
  },
  navLink: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '3px',
    fontSize:       '0.9375rem',
    fontWeight:     500,
    color:          '#181112',
    textDecoration: 'none',
    fontFamily:     "'Be Vietnam Pro', sans-serif",
    letterSpacing:  '-0.01em',
    whiteSpace:     'nowrap',
    transition:     'color 0.2s',
  },
  navLinkActive: {
    color:      PRIMARY,
    fontWeight: 700,
  },
  navDot: {
    width:        '4px',
    height:       '4px',
    borderRadius: '9999px',
    background:   PRIMARY,
  },
  right: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.375rem',
    flexShrink: 0,
  },
  langSelector: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.25rem',
    padding:      '0.25rem 0.625rem',
    borderRadius: '9999px',
    background:   'rgba(235,71,99,0.07)',
    marginInline: '0.25rem',
  },
  langBtn: {
    background:  'none',
    border:      'none',
    fontFamily:  "'Be Vietnam Pro', sans-serif",
    fontSize:    '0.8125rem',
    letterSpacing: '0.04em',
    padding:     '0.125rem 0.125rem',
    lineHeight:  1,
    transition:  'color 0.2s',
  },
  langDivider: {
    color:      'rgba(136,99,105,0.4)',
    fontSize:   '0.6875rem',
    userSelect: 'none',
    lineHeight: 1,
  },
  iconBtn: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    width:           ICON_SIZE,
    height:          ICON_SIZE,
    borderRadius:    '9999px',
    background:      'rgba(235,71,99,0.07)',
    color:           '#3a1a20',
    border:          'none',
    cursor:          'pointer',
    textDecoration:  'none',
    transition:      'background 0.2s, color 0.2s',
    flexShrink:      0,
  },
  hamburgerBtn: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          ICON_SIZE,
    height:         ICON_SIZE,
    borderRadius:   '9999px',
    background:     'rgba(235,71,99,0.07)',
    color:          '#3a1a20',
    border:         'none',
    cursor:         'pointer',
    flexShrink:     0,
  },
  badge: {
    position:     'absolute',
    top:          '-0.25rem',
    right:        '-0.25rem',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    width:        '1rem',
    height:       '1rem',
    borderRadius: '9999px',
    background:   PRIMARY,
    color:        'white',
    fontSize:     '0.5625rem',
    fontWeight:   700,
    fontFamily:   "'Be Vietnam Pro', sans-serif",
  },
  loginBtn: {
    height:       '2.125rem',
    padding:      '0 1.125rem',
    borderRadius: '9999px',
    background:   PRIMARY,
    color:        'white',
    border:       'none',
    fontFamily:   "'Be Vietnam Pro', sans-serif",
    fontSize:     '0.875rem',
    fontWeight:   700,
    cursor:       'not-allowed',
    opacity:      0.5,
    whiteSpace:   'nowrap',
  },
  overlay: {
    position:        'fixed',
    inset:           0,
    zIndex:          40,
    background:      'rgba(33,17,20,0.4)',
    backdropFilter:  'blur(4px)',
  },
  drawer: {
    position:       'absolute',
    top:            0,
    right:          0,
    width:          '16rem',
    height:         '100%',
    background:     'white',
    display:        'flex',
    flexDirection:  'column',
    paddingTop:     '5rem',
    boxShadow:      '-4px 0 24px rgba(0,0,0,0.1)',
  },
  mobileLink: {
    padding:        '1rem 1.5rem',
    fontSize:       '1rem',
    fontWeight:     600,
    color:          '#181112',
    textDecoration: 'none',
    borderBottom:   '1px solid #f0e4e6',
    fontFamily:     "'Be Vietnam Pro', sans-serif",
    transition:     'color 0.2s, background 0.2s',
  },
  mobileLinkActive: {
    color:      PRIMARY,
    background: 'rgba(235,71,99,0.04)',
  },
  mobileLangRow: {
    display:     'flex',
    alignItems:  'center',
    gap:         '0.5rem',
    padding:     '1rem 1.5rem',
    marginTop:   'auto',
    borderTop:   '1px solid #f0e4e6',
  },
  mobileLangBtn: {
    background: 'none',
    border:     'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:   '0.9375rem',
    cursor:     'pointer',
    padding:    0,
    transition: 'color 0.2s',
  },
};