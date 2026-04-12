// src/components/home/HeaderClient.tsx
import { useState, useEffect, useRef } from 'react';
import { ui, defaultLang, languages } from '@/i18n/ui';
import { getLocalizedPath, getNavLinks } from '@/i18n/utils';
import type { Lang, UiKey } from '@/i18n/ui';

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  isLoggedIn:  boolean;
  currentPath: string;
  lang:        Lang;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Función de traducción inline para el componente cliente */
function t(lang: Lang, key: UiKey): string {
  return (ui[lang] as Record<string, string>)[key]
    ?? (ui[defaultLang] as Record<string, string>)[key]
    ?? key;
}

const PRIMARY   = '#eb4763';
const ICON_SIZE = '2.375rem';
const PILL_OPEN = '13.5rem';
const ARROW_D   = 44;

export default function HeaderClient({ isLoggedIn, currentPath, lang }: Props) {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchValue,  setSearchValue]  = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const pillRef  = useRef<HTMLDivElement>(null);

  const navLinks = getNavLinks(lang);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 220);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue('');
    setModalVisible(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!searchOpen) return;
    const down = (e: MouseEvent) => {
      if (!pillRef.current?.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [searchOpen]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  useEffect(() => {
    setModalVisible(searchValue.length >= 3);
  }, [searchValue]);

  const isActive = (href: string) =>
    currentPath === href || currentPath.startsWith(href + '/');

  /** Cambia al idioma destino manteniendo la ruta actual */
  const switchLang = (targetLang: Lang) => {
    if (targetLang === lang) return;
    window.location.href = getLocalizedPath(currentPath, targetLang);
  };

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

        {/* ── Right: search + language selector + auth + hamburger ── */}
        <div style={s.right}>

          {/* ── Search pill ── */}
          <div ref={pillRef} style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: ICON_SIZE,
                width: searchOpen ? PILL_OPEN : ICON_SIZE,
                borderRadius: '9999px',
                overflow: 'hidden',
                border: `1.5px solid ${searchOpen ? 'rgba(235,71,99,0.28)' : 'transparent'}`,
                background: searchOpen ? 'white' : 'rgba(235,71,99,0.07)',
                boxShadow: searchOpen ? '0 4px 20px rgba(235,71,99,0.1)' : 'none',
                transition: [
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
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: searchOpen ? PRIMARY : '#3a1a20',
                  transition: 'color 0.2s',
                  borderRadius: '9999px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', lineHeight: 1, display: 'block' }}>
                  search
                </span>
              </button>

              <input
                ref={inputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t(lang, 'header.search.placeholder')}
                aria-label={t(lang, 'header.search.open')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  padding: '0 1rem 0 0',
                  fontSize: '0.875rem',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  color: '#181112',
                  opacity:      searchOpen ? 1 : 0,
                  transform:    searchOpen ? 'translateX(0)' : 'translateX(-6px)',
                  pointerEvents: searchOpen ? 'auto' : 'none',
                  transition: 'opacity 0.22s ease 0.16s, transform 0.28s ease 0.12s',
                }}
              />
            </div>

            {modalVisible && (
              <div style={s.modal}>
                <div style={s.modalRow}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: PRIMARY, opacity: 0.5, lineHeight: 1, flexShrink: 0 }}>
                    manage_search
                  </span>
                  <div>
                    <p style={s.modalTitle}>"{searchValue}"</p>
                    <p style={s.modalSub}>{t(lang, 'header.search.results')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Selector de idioma ── */}
          <div style={s.langSelector} role="group" aria-label={t(lang, 'lang.select')}>
            {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
              <>
                <button
                  key={l}
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
              </>
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

          {/* ── Hamburger (solo mobile — display controlado solo por CSS, sin inline display) ── */}
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

            {/* Selector de idioma en mobile drawer */}
            <div style={s.mobileLangRow}>
              {(Object.keys(languages) as Lang[]).map((l, i, arr) => (
                <>
                  <button
                    key={l}
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
                </>
              ))}
            </div>
          </nav>
        </div>
      )}

      <style>{`
        /* ── Desktop nav visible, hamburger oculto ── */
        .desktop-nav   { display: flex; }
        .hamburger-btn { display: none !important; }

        /* ── Mobile: invertir visibilidades ── */
        @media (max-width: 767px) {
          .desktop-nav   { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.625rem 2.5rem',
    background: 'rgba(255,255,255,0.87)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(235,71,99,0.1)',
  },

  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
    minWidth: 0,
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: '#181112',
    flexShrink: 0,
  },
  logoIcon: { fontSize: '1.875rem', color: PRIMARY, lineHeight: 1 },
  logoText: {
    fontSize: '1.0625rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },

  nav: {
    alignItems: 'center',
    gap: '1.875rem',
  },
  navLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: '#181112',
    textDecoration: 'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  navLinkActive: {
    color: PRIMARY,
    fontWeight: 700,
  },
  navDot: {
    width: '4px',
    height: '4px',
    borderRadius: '9999px',
    background: PRIMARY,
  },

  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    flexShrink: 0,
  },

  /* ── Language selector ── */
  langSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '9999px',
    background: 'rgba(235,71,99,0.07)',
    marginInline: '0.25rem',
  },
  langBtn: {
    background: 'none',
    border: 'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '0.8125rem',
    letterSpacing: '0.04em',
    padding: '0.125rem 0.125rem',
    lineHeight: 1,
    transition: 'color 0.2s',
  },
  langDivider: {
    color: 'rgba(136,99,105,0.4)',
    fontSize: '0.6875rem',
    userSelect: 'none',
    lineHeight: 1,
  },

  modal: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '0.875rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(235,71,99,0.08)',
    padding: '0.875rem 1rem',
    zIndex: 100,
  },
  modalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  modalTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#181112',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    marginBottom: '0.125rem',
  },
  modalSub: {
    fontSize: '0.75rem',
    color: '#886369',
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },

  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: '9999px',
    background: 'rgba(235,71,99,0.07)',
    color: '#3a1a20',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.2s, color 0.2s',
    flexShrink: 0,
  },

  // ⚠️  SIN display: aquí — la visibilidad la controla SOLO el CSS class .hamburger-btn
  // Inline styles siempre ganan sobre clases CSS, por eso se separó.
  hamburgerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: '9999px',
    background: 'rgba(235,71,99,0.07)',
    color: '#3a1a20',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },

  badge: {
    position: 'absolute',
    top: '-0.25rem',
    right: '-0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    borderRadius: '9999px',
    background: PRIMARY,
    color: 'white',
    fontSize: '0.5625rem',
    fontWeight: 700,
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },

  loginBtn: {
    height: '2.125rem',
    padding: '0 1.125rem',
    borderRadius: '9999px',
    background: PRIMARY,
    color: 'white',
    border: 'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'not-allowed',
    opacity: 0.5,
    whiteSpace: 'nowrap',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    background: 'rgba(33,17,20,0.4)',
    backdropFilter: 'blur(4px)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '16rem',
    height: '100%',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '5rem',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
  },
  mobileLink: {
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#181112',
    textDecoration: 'none',
    borderBottom: '1px solid #f0e4e6',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    transition: 'color 0.2s, background 0.2s',
  },
  mobileLinkActive: {
    color: PRIMARY,
    background: 'rgba(235,71,99,0.04)',
  },

  mobileLangRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    marginTop: 'auto',
    borderTop: '1px solid #f0e4e6',
  },
  mobileLangBtn: {
    background: 'none',
    border: 'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '0.9375rem',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s',
  },
};