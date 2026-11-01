import type { Client } from '../domain/types';

/** Couleurs des managers (dans l'ordre alphabétique) : ambre, bleu, rose, vert, violet, turquoise. */
const PALETTE = ['#d99a00', '#3355ff', '#e0569a', '#1d9a61', '#8b5cf6', '#0ea5b7'];

export function managersOf(clients: Client[]) {
  return [...new Set(clients.map(c => c.manager.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function managerColor(clients: Client[], manager: string) {
  const list = managersOf(clients);
  const i = list.indexOf(manager.trim());
  return i < 0 ? 'var(--muted)' : PALETTE[i % PALETTE.length];
}
