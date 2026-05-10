// src/i18n/utils.ts
// Utilidades para internacionalización con Astro i18n.

import { ui, defaultLang, type Lang, type UiKey } from './ui';

/**
 * Resuelve una ruta de nodo antiguo a la ruta correcta del front.
 * 
 * Bundle → Ruta del front:
 *   node--content_page → / (homepage)
 *   commerce_product--flower → /{uuid}
 *   node--services → /services/{uuid}
 *   node--category → /shop?cat={uuid}
 */
export function resolveNodeRoute(bundle: string, uuid: string, lang: Lang): string {
  const prefix = `/${lang}`;
  const map: Record<string, string> = {
    'node--content_page':     prefix,
    'commerce_product--flower': `${prefix}/${uuid}`,
    'node--services':       `${prefix}/services/${uuid}`,
    'node--category':      `${prefix}/shop?cat=${uuid}`,
  };
  return map[bundle] ?? prefix;
}

/**
 * Extrae el idioma de una URL de Astro.
 * Con prefixDefaultLocale: false:
 *   /          → 'es'
 *   /shop      → 'es'
 *   /en        → 'en'
 *   /en/shop   → 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const [, firstSegment] = url.pathname.split('/');
  if (firstSegment in ui) return firstSegment as Lang;
  return defaultLang;
}

/**
 * Devuelve la función de traducción t() para el idioma dado.
 * Hace fallback al español si falta una clave en el idioma solicitado.
 *
 * Uso en componentes Astro:
 *   const lang = getLangFromUrl(Astro.url);
 *   const t = useTranslations(lang);
 *   t('nav.shop') → 'Tienda' | 'Shop'
 */
export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return (ui[lang] as Record<string, string>)[key]
      ?? (ui[defaultLang] as Record<string, string>)[key]
      ?? key;
  };
}

/**
 * Devuelve el prefijo de idioma para una URL.
 * Con prefixDefaultLocale: true:
 *   'es' → '/es'
 *   'en' → '/en'
 */
export function getPrefix(lang: Lang): string {
  return `/${lang}`;
}

/**
 * Construye la URL equivalente para el idioma destino.
 * Con prefixDefaultLocale: true:
 *   ('/es/shop', 'en')  → '/en/shop'
 *   ('/en/shop', 'es')  → '/es/shop'
 *   ('/en', 'es')       → '/es'
 *
 * @param currentPath  window.location.pathname o Astro.url.pathname
 * @param targetLang   Idioma destino
 */
export function getLocalizedPath(currentPath: string, targetLang: Lang): string {
  // Quitar prefijos /en o /es para obtener la ruta base
  const basePath = currentPath.replace(/^\/(en|es)(\/|$)/, '/') || '/';

  // Agregar el prefijo del idioma destino
  return `/${targetLang}${basePath === '/' ? '' : basePath}`;
}

/**
 * Construye los hrefs de navegación según el idioma activo.
 * Con prefixDefaultLocale: true, todas las rutas tienen prefijo de idioma.
 */
export function getNavLinks(lang: Lang) {
  const prefix = `/${lang}`;
  return [
    { key: 'nav.shop',      href: `${prefix}/shop`      },
    { key: 'nav.courses',   href: `${prefix}/courses`   },
    { key: 'nav.portfolio', href: `${prefix}/portfolio` },
    { key: 'nav.about',     href: `${prefix}/about`     },
  ] as const;
}