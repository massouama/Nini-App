import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

/**
 * Mode « offline » (npm run build:offline) : un seul fichier HTML autonome,
 * à ouvrir par double-clic, sans serveur ni connexion.
 * Une politique de sécurité (CSP) interdit toute requête réseau : aucune donnée ne peut sortir du poste.
 */
const OFFLINE_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'font-src data:',
  'img-src data: blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

function offlineHtml(): Plugin {
  const favicon = 'data:image/svg+xml;base64,' + readFileSync('public/favicon.svg').toString('base64');
  return {
    name: 'nini-offline-html',
    transformIndexHtml: html => html
      .replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${OFFLINE_CSP}" />`)
      .replace('href="./favicon.svg"', `href="${favicon}"`),
  };
}

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline';
  return {
    base: './',
    plugins: offline ? [react(), offlineHtml(), viteSingleFile()] : [react()],
    // En mode offline, la synchronisation est désactivée quoi qu'il arrive.
    define: offline ? { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' } : {},
    publicDir: offline ? false : 'public',
    build: offline ? { outDir: 'dist-offline', assetsInlineLimit: 100_000_000, emptyOutDir: true } : {},
    test: { environment: 'node' },
  } as never;
});
