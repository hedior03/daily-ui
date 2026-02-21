// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hedior.github.io',
  base: '/daily-ui',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
