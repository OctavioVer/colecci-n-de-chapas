import type { FieldDef, FieldValue, Item } from './types';

/**
 * Filtros activos por campo. Para campos de texto, lista y sí/no se guardan los
 * valores elegidos (se cumple si la pieza tiene cualquiera de ellos). Para
 * números, un rango.
 */
export type FieldFilter =
  | { kind: 'values'; values: string[] }
  | { kind: 'range'; min?: number; max?: number };

export type Filters = Record<string, FieldFilter>;

export type SortKey = 'recent' | 'oldest' | 'title' | 'quantity' | `field:${string}`;

export interface Query {
  text: string;
  filters: Filters;
  sort: SortKey;
  onlyDuplicates?: boolean;
}

export const EMPTY_QUERY: Query = { text: '', filters: {}, sort: 'recent' };

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Texto que se muestra y se compara para un valor, independiente del tipo. */
export function displayValue(value: FieldValue | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

function matchesText(item: Item, fields: FieldDef[], words: string[]): boolean {
  if (words.length === 0) return true;
  const haystack = normalize(
    [item.title, item.notes, ...fields.map((f) => displayValue(item.values[f.id]))].join(' '),
  );
  return words.every((w) => haystack.includes(w));
}

function matchesFilter(value: FieldValue | undefined, filter: FieldFilter): boolean {
  if (filter.kind === 'values') {
    if (filter.values.length === 0) return true;
    const shown = normalize(displayValue(value));
    return filter.values.some((v) => normalize(v) === shown);
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return false;
  if (filter.min !== undefined && n < filter.min) return false;
  if (filter.max !== undefined && n > filter.max) return false;
  return true;
}

export function isFilterActive(filter: FieldFilter | undefined): boolean {
  if (!filter) return false;
  if (filter.kind === 'values') return filter.values.length > 0;
  return filter.min !== undefined || filter.max !== undefined;
}

export function countActiveFilters(query: Query): number {
  return (
    Object.values(query.filters).filter(isFilterActive).length + (query.onlyDuplicates ? 1 : 0)
  );
}

function compareValues(a: FieldValue | undefined, b: FieldValue | undefined): number {
  const emptyA = displayValue(a) === '';
  const emptyB = displayValue(b) === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return displayValue(a).localeCompare(displayValue(b), 'es', { sensitivity: 'base', numeric: true });
}

export function applyQuery(items: Item[], fields: FieldDef[], query: Query): Item[] {
  const words = normalize(query.text).split(/\s+/).filter(Boolean);
  const active = Object.entries(query.filters).filter(([, f]) => isFilterActive(f));

  const result = items.filter(
    (item) =>
      (!query.onlyDuplicates || item.quantity > 1) &&
      matchesText(item, fields, words) &&
      active.every(([fieldId, filter]) => matchesFilter(item.values[fieldId], filter)),
  );

  const sort = query.sort;
  result.sort((a, b) => {
    if (sort === 'recent') return b.createdAt - a.createdAt;
    if (sort === 'oldest') return a.createdAt - b.createdAt;
    if (sort === 'quantity') return b.quantity - a.quantity || a.title.localeCompare(b.title, 'es');
    if (sort === 'title') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    const fieldId = sort.slice('field:'.length);
    return compareValues(a.values[fieldId], b.values[fieldId]) || a.title.localeCompare(b.title, 'es');
  });
  return result;
}

export interface Facet {
  value: string;
  count: number;
}

/**
 * Valores posibles de un campo con la cantidad de piezas que tiene cada uno.
 * Sirve para armar los filtros y los conteos ("Argentina: 124 chapas").
 */
export function facetValues(items: Item[], field: FieldDef): Facet[] {
  const counts = new Map<string, Facet>();
  for (const item of items) {
    const shown = displayValue(item.values[field.id]);
    if (!shown) continue;
    const key = normalize(shown);
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { value: shown, count: 1 });
  }
  const facets = [...counts.values()];
  if (field.type === 'select' && field.options) {
    const order = field.options.map(normalize);
    const rank = (v: string) => {
      const i = order.indexOf(normalize(v));
      return i === -1 ? order.length : i;
    };
    return facets.sort((a, b) => b.count - a.count || rank(a.value) - rank(b.value));
  }
  return facets.sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es', { numeric: true }),
  );
}
