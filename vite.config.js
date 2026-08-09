import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bookstore-website/',
  server: {
    host: true,
    port: 5173,
  },
});
