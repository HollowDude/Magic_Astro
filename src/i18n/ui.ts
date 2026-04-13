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

    // ── Hero Section (fallbacks cuando Drupal no responde) ──────────────────
    'hero.title':          'Bienvenida a Maggy Flowers',
    'hero.slogan':         'Donde las flores se convierten en magia',
    'hero.description':    'Creamos diseños florales artificiales y naturales para regalar, decorar y celebrar momentos inolvidables. Y además, te enseñamos a hacer lo mismo desde cero, con confianza, creatividad y propósito.',
    'hero.cta.shop':       'Ver ofertas',
    'hero.cta.courses':    'Explorar cursos',
    'hero.slide.natural':  'Flores naturales',
    'hero.slide.exclusive':'Arreglos exclusivos',
    'hero.slide.events':   'Eventos especiales',
    'hero.slide.nav':      'Navegación de slides',
    'hero.slide.label':    'Slide',
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

    // ── Hero Section (fallbacks cuando Drupal no responde) ──────────────────
    'hero.title':          'Welcome to Maggy Flowers',
    'hero.slogan':         'Where flowers become magic',
    'hero.description':    'We create artificial and natural floral designs for gifting, decorating, and celebrating unforgettable moments. We also teach you to do the same from scratch — with confidence, creativity, and purpose.',
    'hero.cta.shop':       'Browse offers',
    'hero.cta.courses':    'Explore courses',
    'hero.slide.natural':  'Natural flowers',
    'hero.slide.exclusive':'Exclusive arrangements',
    'hero.slide.events':   'Special events',
    'hero.slide.nav':      'Slide navigation',
    'hero.slide.label':    'Slide',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];