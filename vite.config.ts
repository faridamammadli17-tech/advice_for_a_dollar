import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The dev server honours a PORT from the environment rather than pinning 5173,
 * so it can coexist with anything else already running locally.
 *
 * `/api` is proxied to the Fastify server so that the browser sees one origin.
 * That is not just convenience: the admin session is an httpOnly, SameSite
 * cookie, and cross-origin requests would not carry it.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    /*
     * Vite refuses requests for hostnames it does not recognise, which is why
     * a tunnel returns 403 by default. That default is protecting against DNS
     * rebinding, so this allows the one domain used for sharing a preview
     * rather than switching the protection off.
     *
     * Development only — a production build serves from a real web server and
     * never consults this.
     */
    allowedHosts: ['.trycloudflare.com', 'localhost'],
    proxy: {
      '/api': {
        target: process.env.API_ORIGIN ?? 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
  // `vite preview` serves the production bundle the same way, so a shared
  // preview through a tunnel shows the real thing rather than the dev build.
  preview: {
    allowedHosts: ['.trycloudflare.com', 'localhost'],
  },
});
