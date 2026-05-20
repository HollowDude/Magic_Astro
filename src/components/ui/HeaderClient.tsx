// src/components/home/HeaderClient.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { ui, defaultLang, languages } from '@/i18n/ui';
import { getLocalizedPath, getNavLinks, getPrefix } from '@/i18n/utils';
import type { Lang, UiKey } from '@/i18n/ui';
import { Fragment } from 'react';
import type { HeaderLogoData } from '@/services/nodehive/nodehive.header';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  price: string;
  thumbnail: string | null;
}

interface Props {
  isLoggedIn:    boolean;
  currentPath:   string;
  lang:          Lang;
  navLinks?:     { label: string; href: string }[];
  headerLogoData?: HeaderLogoData | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

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

// ── SearchResultPanel ─────────────────────────────────────────────────────────

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
  const prefix = getPrefix(lang);

  return (
    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 min-w-[18rem] bg-white rounded-[0.875rem] shadow-[0_8px_32px_rgba(0,0,0,0.1),0_0_0_1px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] z-[100] overflow-hidden py-3">

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-4">
              <div className="w-11 h-11 rounded-lg shrink-0 bg-border animate-pulse" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 rounded-full bg-border w-[70%] animate-pulse" />
                <div className="h-2.5 rounded-full bg-border w-[35%] opacity-60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-5 px-4 text-center">
          <span className="material-symbols-outlined text-[1.5rem] text-primary opacity-40 leading-none">
            search_off
          </span>
          <p className="font-body text-[0.875rem] text-body-color m-0">
            {ss.noResults} <strong className="text-headline">"{query}"</strong>
          </p>
        </div>
      )}

      {/* Resultados */}
      {!loading && results.length > 0 && (
        <>
          <ul className="m-0 p-0" role="listbox" aria-label={`Resultados para ${query}`}>
            {results.map((r) => (
              <li key={r.id} className="list-none">
                <a
                  href={`${prefix}/${r.id}`}
                  className="flex items-center gap-3 py-2 px-4 no-underline text-inherit transition-colors duration-150 cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                >
                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-blush">
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail}
                        alt={r.title}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[1.25rem] text-primary opacity-40 leading-none">
                          local_florist
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[0.875rem] font-semibold text-headline m-0 truncate">{r.title}</p>
                    <p className="font-body text-[0.75rem] text-muted m-0 mt-0.5">
                      {r.price ? `${ss.from} ${r.price}` : ss.priceNA}
                    </p>
                  </div>

                  {/* Chevron */}
                  <span className="material-symbols-outlined text-[1rem] text-muted opacity-50 leading-none shrink-0">
                    chevron_right
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Mostrar más */}
          {hasMore && (
            <div className="border-t border-border mt-1.5 pt-1.5 px-4 pb-0.5">
              <a href={shopHref} className="block font-body text-[0.8125rem] font-bold text-primary no-underline text-center py-1.5 rounded-lg transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]">
                {ss.showMore}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ── HeaderClient ──────────────────────────────────────────────────────────────

export default function HeaderClient({ isLoggedIn, currentPath, lang, navLinks: navLinksProp, headerLogoData }: Props) {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchValue,   setSearchValue]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore,       setHasMore]       = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const pillRef     = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fallbackLinks = getNavLinks(lang);
  const navLinks = navLinksProp && navLinksProp.length > 0 ? navLinksProp : fallbackLinks;
  const shopHref = `${getPrefix(lang)}/shop`;

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

  useEffect(() => {
    if (!searchOpen) return;
    const down = (e: MouseEvent) => {
      if (!pillRef.current?.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [closeSearch]);

  useEffect(() => {
    if (searchValue.length === 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSearchResults([]);
      setSearchLoading(false);
      setHasMore(false);
      return;
    }

    setSearchLoading(true);

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
    }, searchValue.length >= 3 ? DEBOUNCE_MS : 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, lang]);

  const isActive = (href: string) =>
    currentPath === href || currentPath.startsWith(href + '/');

  const switchLang = (targetLang: Lang) => {
    if (targetLang === lang) return;
    try {
      localStorage.setItem('mf-lang', targetLang);
      document.cookie = `mf-lang=${targetLang};Path=/;Max-Age=31536000;SameSite=Lax`;
      if (window.__NODEHIVE_EDITOR__) {
        window.__NODEHIVE_EDITOR__.setLang(targetLang);
      }
    } catch {}
    window.location.href = getLocalizedPath(currentPath, targetLang);
  };

  const showPanel = searchOpen && searchValue.length >= 1;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 py-2.5 px-4 sm:px-10 bg-white/85 backdrop-blur-md border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">

        {/* ── Left: logo + nav ── */}
        <div className="flex items-center gap-10 min-w-0">
          <a href={headerLogoData?.linkUri?.replace(/^internal:/, '') ?? getPrefix(lang)} className="flex items-center gap-2 no-underline text-text-main shrink-0">
            <div
              data-nodehive-entity-type={headerLogoData?.entityType ?? undefined}
              data-nodehive-entity-bundle={headerLogoData?.bundle ?? undefined}
              data-nodehive-entity-id={headerLogoData?.paragraphId ?? undefined}
              data-nodehive-entity-internal-id={headerLogoData?.paragraphInternalId ?? undefined}
              className="relative"
            >
              <img
                src={headerLogoData?.logoUrl ?? '/logo_siglas.png'}
                alt="Maggy Flowers"
                className="h-8 w-auto object-contain"
                data-nodehive-field="field_logo"
              />
              <button
                type="button"
                className="nh-only absolute -top-1 -right-1 items-center justify-center w-5 h-5 rounded-full bg-primary text-white shadow-md z-50 p-0 border-none cursor-pointer"
                aria-label="Editar logo"
                data-nodehive-field="field_logo"
                onClick={(e) => e.preventDefault()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit</span>
              </button>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center gap-1 text-[0.9375rem] no-underline font-body tracking-tight whitespace-nowrap transition-colors duration-200 ${isActive(link.href) ? 'text-primary font-bold' : 'text-text-main font-medium hover:text-primary'}`}
              >
                {'key' in link ? t(lang, link.key) : link.label}
                {isActive(link.href) && <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary" />}
              </a>
            ))}
          </nav>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* ── Search pill ── */}
          <div ref={pillRef} className="relative">
            <div
              className={`flex items-center h-[2.375rem] rounded-full overflow-hidden transition-all duration-300 ease-out border-[1.5px] ${searchOpen ? 'w-[13.5rem] border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-white shadow-[0_4px_20px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]' : 'w-[2.375rem] border-transparent bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] shadow-none hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'}`}
            >
              <button
                onClick={searchOpen ? closeSearch : openSearch}
                aria-label={t(lang, searchOpen ? 'header.search.close' : 'header.search.open')}
                className={`shrink-0 flex items-center justify-center w-[2.375rem] h-[2.375rem] border-none bg-transparent cursor-pointer transition-colors duration-200 rounded-full ${searchOpen ? 'text-primary' : 'text-text-main'}`}
              >
                <span className="material-symbols-outlined text-[1.25rem] leading-none block">
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
                className={`flex-1 min-w-0 border-none bg-transparent outline-none pr-4 text-[0.875rem] font-body text-text-main transition-all duration-300 ${searchOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-1.5 pointer-events-none'}`}
              />

              {/* Spinner */}
              {searchLoading && (
                <div className="shrink-0 w-4 h-4 mr-3 rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] border-t-primary animate-spin" />
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
          <div className="hidden sm:flex items-center gap-1 py-1 px-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] mx-1" role="group" aria-label={t(lang, 'lang.select')}>
            {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
              <Fragment key={l}>
                <button
                  onClick={() => switchLang(l)}
                  disabled={l === lang}
                  aria-current={l === lang ? 'true' : undefined}
                  className={`bg-transparent border-none font-body text-[0.8125rem] tracking-wider py-0.5 px-0.5 leading-none transition-colors duration-200 ${l === lang ? 'text-primary font-bold cursor-default' : 'text-muted font-medium cursor-pointer hover:text-text-main'}`}
                >
                  {l.toUpperCase()}
                </button>
                {i < arr.length - 1 && (
                  <span key={`sep-${l}`} className="text-[color-mix(in_srgb,var(--color-muted)_40%,transparent)] text-[0.6875rem] select-none leading-none">|</span>
                )}
              </Fragment>
            ))}
          </div>

          {/* ── Auth ── */}
          {isLoggedIn ? (
            <>
              <a href={`${getPrefix(lang)}/dashboard`} className="flex items-center justify-center w-[2.375rem] h-[2.375rem] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] text-text-main border-none cursor-pointer no-underline transition-all duration-200 shrink-0 hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" aria-label={t(lang, 'header.profile')}>
                <span className="material-symbols-outlined text-[1.25rem] leading-none">account_circle</span>
              </a>
              <button className="relative flex items-center justify-center w-[2.375rem] h-[2.375rem] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] text-text-main border-none cursor-pointer transition-all duration-200 shrink-0 hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]" aria-label={t(lang, 'header.cart')} disabled>
                <span className="material-symbols-outlined text-[1.25rem] leading-none">shopping_bag</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[0.5625rem] font-bold font-body">0</span>
              </button>
            </>
          ) : (
            <a
              href={`${getPrefix(lang)}/login`}
              className="hidden sm:inline-flex items-center justify-center h-[2.125rem] px-4.5 rounded-full bg-primary text-white font-body text-[0.875rem] font-bold no-underline whitespace-nowrap transition-all hover:bg-primary-dark"
            >
              {t(lang, 'header.login')}
            </a>
          )}

          {/* ── Hamburger (mobile) ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden items-center justify-center w-[2.375rem] h-[2.375rem] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] text-text-main border-none cursor-pointer shrink-0 transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
            aria-label={t(lang, 'header.menu')}
          >
            <span className="material-symbols-outlined text-[1.25rem] leading-none">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#211114]/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <nav className="absolute top-0 right-0 w-64 h-full bg-white flex flex-col pt-20 shadow-[-4px_0_24px_rgba(0,0,0,0.1)]" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`py-4 px-6 text-base font-semibold no-underline border-b border-border font-body transition-colors duration-200 ${isActive(link.href) ? 'text-primary bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)]' : 'text-text-main hover:bg-black/5'}`}
              >
                {'key' in link ? t(lang, link.key) : link.label}
              </a>
            ))}

            <div className="flex items-center gap-2 py-4 px-6 mt-auto border-t border-border">
              {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
                <Fragment key={l}>
                  <button
                    onClick={() => switchLang(l)}
                    disabled={l === lang}
                    className={`bg-transparent border-none font-body text-[0.9375rem] cursor-pointer p-0 transition-colors duration-200 ${l === lang ? 'text-primary font-bold' : 'text-muted font-medium hover:text-text-main'}`}
                  >
                    {languages[l]}
                  </button>
                  {i < arr.length - 1 && (
                    <span key={`msep-${l}`} className="text-border text-[0.75rem]">|</span>
                  )}
                </Fragment>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}