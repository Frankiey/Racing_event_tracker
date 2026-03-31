import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://frankiey.github.io',
  base: '/Racing_event_tracker',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['d3-geo', 'd3-drag', 'd3-selection', 'd3-timer', 'topojson-client'],
    },
  },
  output: 'static',
});
