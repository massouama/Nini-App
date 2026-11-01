/** CSV au format Excel français (séparateur « ; » + BOM UTF-8). */
export const csv = (rows: (string | number | null | undefined)[][]) => {
  const cell = (v: unknown) => {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
};

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const download = (filename: string, content: string, mime = 'text/plain') => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  // Sur iPad / iPhone : feuille de partage (AirDrop, « Enregistrer dans Fichiers »…), qui fonctionne aussi
  // dans l'app installée sur l'écran d'accueil. Aucun envoi réseau : c'est le système qui propose les choix.
  const file = new File([blob], filename, { type: mime });
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
