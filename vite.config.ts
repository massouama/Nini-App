import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

/*
 * Trois façons de construire l'app :
 *  - npm run build          → version web classique (dist/)
 *  - npm run build:offline  → un seul fichier Nini.html, ouvert par double-clic (PC)
 *  - npm run build:pwa      → app installable sur l'écran d'accueil de l'iPad, puis 100 % hors ligne (dist-pwa/)
 *
 * Dans les deux derniers cas, une politique de sécurité (CSP) interdit à l'app toute requête réseau :
 * aucune donnée ne peut sortir de l'appareil.
 */
const csp = (pwa: boolean) => [
  "default-src 'none'",
  pwa ? "script-src 'self' 'unsafe-inline'" : "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'font-src data:',
  pwa ? "img-src 'self' data: blob:" : 'img-src data: blob:',
  ...(pwa ? ["manifest-src 'self'", "worker-src 'self'"] : []),
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

function lockedHtml(pwa: boolean): Plugin {
  const favicon = 'data:image/svg+xml;base64,' + readFileSync('public/favicon.svg').toString('base64');
  const pwaHead = `
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Nini" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />`;
  return {
    name: 'nini-locked-html',
    transformIndexHtml: html => html
      .replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp(pwa)}" />${pwa ? pwaHead : ''}`)
      .replace('href="./favicon.svg"', `href="${favicon}"`),
  };
}

export default defineConfig(({ mode }) => {
  const locked = mode === 'offline' || mode === 'pwa';
  return {
    base: './',
    plugins: locked ? [react(), lockedHtml(mode === 'pwa'), viteSingleFile()] : [react()],
    // Hors ligne : la synchronisation est désactivée quoi qu'il arrive.
    define: locked ? { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' } : {},
    publicDir: locked ? false : 'public',
    build: locked ? { outDir: mode === 'pwa' ? 'dist-pwa' : 'dist-offline', assetsInlineLimit: 100_000_000, emptyOutDir: true } : {},
    test: { environment: 'node' },
  } as never;
});
