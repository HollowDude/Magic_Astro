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

    // ── Academia / Cursos ─────────────────────────────────────────────────
    'courses.title':               'Academia Floral',
    'courses.description':         'Aprende técnicas exclusivas con instructores expertos.',
    'courses.filter.all':          'Todos',
    'courses.filter.inperson':     'Presencial',
    'courses.filter.digital':      'Digital',
    'courses.filter.workshop':     'Taller',
    'courses.load_more':           'Cargar más cursos',
    'courses.view':                'Ver curso',
    'courses.free':                'Gratis',
    'courses.badge.inperson':      'Presencial',
    'courses.badge.digital':       'Digital',
    'courses.badge.workshop':      'Taller',
    'courses.level.beginner':      'Principiante',
    'courses.level.intermediate':  'Intermedio',
    'courses.level.advanced':      'Avanzado',
    'courses.level.all':           'Todos los niveles',
    'courses.stats.students':      'Estudiantes formados',
    'courses.stats.courses':       'Cursos disponibles',
    'courses.stats.rating':        'Valoración promedio',
    'courses.stats.satisfaction':  'Satisfacción garantizada',
    'courses.spots_left':          'cupos',
    'courses.reviews':             'reseñas',
    'courses.no_courses':          'No hay cursos disponibles por el momento.',

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
    'shop.filters.ocasion':        'Ocasión',
    'shop.filters.ocasion.birthday':      'Cumpleaños',
    'shop.filters.ocasion.anniversary':   'Aniversario',
    'shop.filters.ocasion.wedding':       'Bodas',
    'shop.filters.ocasion.condolence':    'Condolencias',
    'shop.filters.ocasion.aniversary':    'Aniversario',
    'shop.filters.clear':          'Limpiar filtros',
    'shop.add_to_cart':            'Añadir al carrito',
    'shop.price_on_request':       'Consultar precio',
    'shop.no_products':            'No hay productos que coincidan con los filtros.',
    'shop.showing':                'Mostrando',
    'shop.of':                     'de',
    'shop.results':                'resultados',
    'shop.pagination.prev':        'Anterior',
    'shop.pagination.next':        'Siguiente',

    // ── Detalle de producto ──────────────────────────────────────────────────
    'product.personalization.label':       'Personalización (Tarjeta o Cinta)',
    'product.personalization.hint':        'Escribe el mensaje que deseas incluir en la tarjeta o cinta decorativa (máx. 150 caracteres).',
    'product.personalization.placeholder': 'Ej: Feliz aniversario, con todo mi amor...',
    'product.contact':                     'Contáctenos',
    'product.free_shipping':               'Envío gratis en pedidos superiores a $100',
    'product.related.title':               'Productos Relacionados',
    'product.related.see_all':             'Ver todo',
    'product.not_found':                   'Producto no encontrado.',

    // ── Portfolio ────────────────────────────────────────────────────────────
    'portfolio.contact':                   'Contactar',
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

    // ── Academy / Courses ─────────────────────────────────────────────────
    'courses.title':               'Floral Academy',
    'courses.description':         'Learn exclusive techniques with expert instructors.',
    'courses.filter.all':          'All',
    'courses.filter.inperson':     'In-Person',
    'courses.filter.digital':      'Digital',
    'courses.filter.workshop':     'Workshop',
    'courses.load_more':           'Load more courses',
    'courses.view':                'View course',
    'courses.free':                'Free',
    'courses.badge.inperson':      'In-Person',
    'courses.badge.digital':       'Digital',
    'courses.badge.workshop':      'Workshop',
    'courses.level.beginner':      'Beginner',
    'courses.level.intermediate':  'Intermediate',
    'courses.level.advanced':      'Advanced',
    'courses.level.all':           'All levels',
    'courses.stats.students':      'Students trained',
    'courses.stats.courses':       'Courses available',
    'courses.stats.rating':        'Average rating',
    'courses.stats.satisfaction':  'Satisfaction guaranteed',
    'courses.spots_left':          'spots',
    'courses.reviews':             'reviews',
    'courses.no_courses':          'No courses available at the moment.',

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
    'shop.filters.ocasion':        'Occasion',
    'shop.filters.ocasion.birthday':      'Birthday',
    'shop.filters.ocasion.anniversary':   'Anniversary',
    'shop.filters.ocasion.wedding':       'Wedding',
    'shop.filters.ocasion.condolence':    'Condolence',
    'shop.filters.ocasion.aniversary':    'Anniversary',
    'shop.filters.clear':          'Clear filters',
    'shop.add_to_cart':            'Add to cart',
    'shop.price_on_request':       'Price on request',
    'shop.no_products':            'No products match your filters.',
    'shop.showing':                'Showing',
    'shop.of':                     'of',
    'shop.results':                'results',
    'shop.pagination.prev':        'Previous',
    'shop.pagination.next':        'Next',

    // ── Product Detail ────────────────────────────────────────────────────────
    'product.personalization.label':       'Personalization (Card or Ribbon)',
    'product.personalization.hint':        'Write the message you want included on the card or decorative ribbon (max. 150 characters).',
    'product.personalization.placeholder': 'E.g.: Happy anniversary, with all my love...',
    'product.contact':                     'Contact Us',
    'product.free_shipping':               'Free shipping on orders over $100',
    'product.related.title':               'Related Products',
    'product.related.see_all':             'See all',
    'product.not_found':                   'Product not found.',

    // ── Portfolio ────────────────────────────────────────────────────────────
    'portfolio.contact':                   'Contact Us',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];