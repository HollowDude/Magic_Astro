// src/i18n/ui.ts
// Diccionario de traducciones para la UI del sitio.

export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'es';

export const ui = {
  es: {
    // ── Navegación ──────────────────────────────────────────────────────────
    'nav.home':      'Inicio',
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

    // ── Tienda ───────────────────────────────────────────────────────────────
    'shop.title':                  'Tienda',
    'shop.description':            'Encuentra el arreglo floral perfecto para cada ocasión.',
    'shop.sort.label':             'Ordenar por:',
    'shop.sort.featured':          'Destacados',
    'shop.sort.price_asc':         'Precio: menor a mayor',
    'shop.sort.price_desc':        'Precio: mayor a menor',
    'shop.sort.newest':            'Más nuevos',
    'shop.filters.toggle':         'Filtros',
    'shop.filters.apply':          'Ver resultados',
    'shop.filters.categories':     'Categorías',
    'shop.filters.price':          'Precio',
    'shop.filters.price.under50':  'Menos de $50',
    'shop.filters.price.50_100':   '$50 – $100',
    'shop.filters.price.100_200':  '$100 – $200',
    'shop.filters.price.over200':  'Más de $200',
    'shop.filters.colors':         'Paleta de colores',
    'shop.filters.type':           'Tipo',
    'shop.filters.type.natural':   'Natural',
    'shop.filters.type.artificial':'Artificial',
    'shop.filters.type.seco':      'Seco',
    'shop.filters.clear':          'Limpiar filtros',
    'shop.add_to_cart':            'Añadir al carrito',
    'shop.price_on_request':       'Consultar precio',
    'shop.no_products':            'No hay productos que coincidan con los filtros.',
    'shop.showing':                'Mostrando',
    'shop.of':                     'de',
    'shop.results':                'resultados',
    'shop.pagination.prev':        'Anterior',
    'shop.pagination.next':        'Siguiente',
  },
  en: {
    // ── Navigation ──────────────────────────────────────────────────────────
    'nav.home':      'Home',
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

    // ── Hero Section ─────────────────────────────────────────────────────────
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

    // ── Shop ─────────────────────────────────────────────────────────────────
    'shop.title':                  'Shop',
    'shop.description':            'Find the perfect floral arrangement for every occasion.',
    'shop.sort.label':             'Sort by:',
    'shop.sort.featured':          'Featured',
    'shop.sort.price_asc':         'Price: Low to High',
    'shop.sort.price_desc':        'Price: High to Low',
    'shop.sort.newest':            'Newest',
    'shop.filters.toggle':         'Filters',
    'shop.filters.apply':          'View results',
    'shop.filters.categories':     'Categories',
    'shop.filters.price':          'Price',
    'shop.filters.price.under50':  'Under $50',
    'shop.filters.price.50_100':   '$50 – $100',
    'shop.filters.price.100_200':  '$100 – $200',
    'shop.filters.price.over200':  'Over $200',
    'shop.filters.colors':         'Color Palette',
    'shop.filters.type':           'Type',
    'shop.filters.type.natural':   'Natural',
    'shop.filters.type.artificial':'Artificial',
    'shop.filters.type.seco':      'Dried',
    'shop.filters.clear':          'Clear filters',
    'shop.add_to_cart':            'Add to cart',
    'shop.price_on_request':       'Price on request',
    'shop.no_products':            'No products match your filters.',
    'shop.showing':                'Showing',
    'shop.of':                     'of',
    'shop.results':                'results',
    'shop.pagination.prev':        'Previous',
    'shop.pagination.next':        'Next',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];