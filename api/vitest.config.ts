import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: './',
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: 'node',
    globals: true,
    css: false,
  },
});
