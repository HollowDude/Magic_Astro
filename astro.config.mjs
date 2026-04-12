import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  output: 'server',
  server: {
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      // Español en la raíz (/), Inglés bajo /en/
      // Ejemplo: / → es, /en/ → en, /en/shop → en
      prefixDefaultLocale: false,
    },
  },
});
