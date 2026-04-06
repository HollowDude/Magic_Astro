import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'server', // SSR necesario para endpoints y cookies
  server: {
    port: 4321,
  },
});
