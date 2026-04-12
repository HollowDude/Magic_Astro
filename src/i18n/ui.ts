// src/i18n/ui.ts
// Diccionario de traducciones para la UI del sitio.
// Agregar nuevas claves aquí y usarlas con useTranslations().

export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'es';

export const ui = {
  es: {
    // ── Navegación ──────────────────────────────────────────────────────────
    'nav.shop':      'Tienda',
    'nav.courses':   'Cursos',
    'nav.portfolio': 'Portafolio',
    'nav.about':     'Sobre Nosotros',

    // ── Header ──────────────────────────────────────────────────────────────
    'header.search.placeholder': 'Buscar flores...',
    'header.search.open':        'Abrir búsqueda',
    'header.search.close':       'Cerrar búsqueda',
    'header.search.results':     'Los resultados aparecerán aquí pronto.',
    'header.login':              'Iniciar sesión',
    'header.profile':            'Mi perfil',
    'header.cart':               'Carrito',
    'header.menu':               'Menú',

    // ── Idioma ──────────────────────────────────────────────────────────────
    'lang.select': 'Seleccionar idioma',
  },
  en: {
    // ── Navigation ──────────────────────────────────────────────────────────
    'nav.shop':      'Shop',
    'nav.courses':   'Courses',
    'nav.portfolio': 'Portfolio',
    'nav.about':     'About Us',

    // ── Header ──────────────────────────────────────────────────────────────
    'header.search.placeholder': 'Search flowers...',
    'header.search.open':        'Open search',
    'header.search.close':       'Close search',
    'header.search.results':     'Results will appear here soon.',
    'header.login':              'Sign in',
    'header.profile':            'My profile',
    'header.cart':               'Cart',
    'header.menu':               'Menu',

    // ── Language ─────────────────────────────────────────────────────────────
    'lang.select': 'Select language',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];