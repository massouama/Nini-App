// Renomme dist-offline/index.html en Nini.html et le copie dans release/ (fichier à distribuer).
import { copyFileSync, mkdirSync, renameSync, statSync } from 'node:fs';
renameSync('dist-offline/index.html', 'dist-offline/Nini.html');
mkdirSync('release', { recursive: true });
copyFileSync('dist-offline/Nini.html', 'release/Nini.html');
console.log(`release/Nini.html (${Math.round(statSync('release/Nini.html').size / 1024)} Ko)`);
