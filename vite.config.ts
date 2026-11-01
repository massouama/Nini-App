import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative : le build fonctionne sur n'importe quel hébergement statique (sous-dossier compris).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
} as never);
