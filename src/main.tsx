import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { startSecurityMonitoring } from './lib/securityLog';

// Journal de sécurité : ouverture de l'app, tentatives de connexion bloquées, exports.
startSecurityMonitoring();

// Demande au navigateur de ne pas effacer les données locales en cas de manque d'espace.
void navigator.storage?.persist?.().catch(() => {});

// Version iPad : enregistre le module hors ligne (l'app reste disponible sans connexion).
if (import.meta.env.MODE === 'pwa' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('./sw.js').catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
