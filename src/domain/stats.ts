import type { Item } from './types';

export interface CollectionStats {
  /** Piezas distintas cargadas. */
  unique: number;
  /** Total de ejemplares, contando repetidas. */
  total: number;
  /** Ejemplares sobrantes disponibles para intercambio. */
  duplicates: number;
  withPhoto: number;
}

export function computeStats(items: Item[]): CollectionStats {
  let total = 0;
  let duplicates = 0;
  let withPhoto = 0;
  for (const item of items) {
    total += item.quantity;
    duplicates += Math.max(0, item.quantity - 1);
    if (item.photos.length > 0) withPhoto += 1;
  }
  return { unique: items.length, total, duplicates, withPhoto };
}

export function formatCount(n: number): string {
  return n.toLocaleString('es-AR');
}
