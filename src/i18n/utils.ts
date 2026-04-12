// src/i18n/utils.ts
// Utilidades para internacionalización con Astro i18n.

import { ui, defaultLang, type Lang, type UiKey } from './ui';

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
 * Construye la URL equivalente para el idioma destino.
 * Con prefixDefaultLocale: false:
 *   ('/shop', 'en')  → '/en/shop'
 *   ('/en/shop', 'es') → '/shop'
 *   ('/', 'en')      → '/en'
 *
 * @param currentPath  window.location.pathname o Astro.url.pathname
 * @param targetLang   Idioma destino
 */
export function getLocalizedPath(currentPath: string, targetLang: Lang): string {
  // Quitar prefijo /en si existe para obtener la ruta base
  const basePath = currentPath.replace(/^\/en(\/|$)/, '/') || '/';

  if (targetLang === defaultLang) {
    // Español → sin prefijo
    return basePath;
  }

  // Inglés → agregar /en
  return `/en${basePath === '/' ? '' : basePath}`;
}

/**
 * Construye los hrefs de navegación según el idioma activo.
 * Con prefixDefaultLocale: false, las rutas en español no tienen prefijo.
 */
export function getNavLinks(lang: Lang) {
  const prefix = lang === defaultLang ? '' : `/${lang}`;
  return [
    { key: 'nav.shop',      href: `${prefix}/shop`      },
    { key: 'nav.courses',   href: `${prefix}/courses`   },
    { key: 'nav.portfolio', href: `${prefix}/portfolio` },
    { key: 'nav.about',     href: `${prefix}/about`     },
  ] as const;
}