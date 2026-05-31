import { defineConfig } from 'vite';

export default defineConfig({
  base: '/snooker-scoure-counter-app/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
  },
});
