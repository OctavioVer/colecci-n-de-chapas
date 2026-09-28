import { createId } from '@/domain/id';
import { normalize } from '@/domain/search';
import { uniqueFieldId } from '@/domain/templates';
import type { Collection, FieldDef, FieldType, FieldValue, Item } from '@/domain/types';

import type { RawCell, Table } from './read';

/** A dónde va cada columna del Excel. */
export type ColumnTarget =
  | { kind: 'title' }
  | { kind: 'quantity' }
  | { kind: 'notes' }
  | { kind: 'field'; fieldId: string }
  | { kind: 'new'; label: string; type: FieldType }
  | { kind: 'ignore' };

const TITLE_NAMES = ['nombre', 'titulo', 'descripcion', 'detalle', 'name', 'pieza', 'item'];
const QUANTITY_NAMES = ['cantidad', 'cant', 'cant.', 'unidades', 'ejemplares', 'qty', 'stock'];
const NOTES_NAMES = ['notas', 'nota', 'observaciones', 'obs', 'obs.', 'comentarios'];

export function guessType(values: RawCell[]): FieldType {
  const present = values.filter((v) => v !== null);
  if (present.length === 0) return 'text';
  if (present.every((v) => typeof v === 'boolean' || isBooleanWord(String(v)))) return 'boolean';
  if (present.every((v) => parseNumber(v) !== null)) return 'number';
  const distinct = new Set(present.map((v) => normalize(String(v))));
  if (present.length >= 8 && distinct.size <= 12 && distinct.size <= present.length / 3) return 'select';
  return 'text';
}

/** Propone a qué campo va cada columna comparando los nombres. */
export function autoMap(table: Table, collection: Collection): ColumnTarget[] {
  const byLabel = new Map(collection.fields.map((f) => [normalize(f.label), f]));
  const taken = new Set<string>();

  return table.headers.map((header, col) => {
    const key = normalize(header);
    const take = (id: string, target: ColumnTarget): ColumnTarget => {
      if (taken.has(id)) return { kind: 'ignore' };
      taken.add(id);
      return target;
    };
    const field = byLabel.get(key);
    if (field) return take(field.id, { kind: 'field', fieldId: field.id });
    if (TITLE_NAMES.includes(key)) return take('title', { kind: 'title' });
    if (QUANTITY_NAMES.includes(key)) return take('quantity', { kind: 'quantity' });
    if (NOTES_NAMES.includes(key)) return take('notes', { kind: 'notes' });
    return { kind: 'new', label: header, type: guessType(table.rows.map((r) => r[col])) };
  });
}

export function parseNumber(value: RawCell | undefined): number | null {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = value.trim().replace(/\s/g, '');
  if (!/^-?[\d.,]+$/.test(s)) return null;
  // "1.234,5" (formato argentino) o "1,234.5"
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (lastDot > lastComma && lastComma !== -1) s = s.replace(/,/g, '');
  else if (lastComma === -1 && (s.match(/\./g) ?? []).length > 1) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const TRUE_WORDS = ['si', 'sí', 'yes', 'true', 'verdadero', 'x', '1'];
const FALSE_WORDS = ['no', 'false', 'falso', '0'];

function isBooleanWord(s: string): boolean {
  const n = normalize(s);
  return TRUE_WORDS.includes(n) || FALSE_WORDS.includes(n);
}

function toFieldValue(raw: RawCell, field: FieldDef): FieldValue {
  if (raw === null) return null;
  switch (field.type) {
    case 'number':
      return parseNumber(raw) ?? String(raw);
    case 'boolean': {
      if (typeof raw === 'boolean') return raw;
      const n = normalize(String(raw));
      if (TRUE_WORDS.includes(n)) return true;
      if (FALSE_WORDS.includes(n)) return false;
      return null;
    }
    case 'select': {
      const text = String(raw);
      const match = field.options?.find((o) => normalize(o) === normalize(text));
      return match ?? text;
    }
    default:
      return String(raw);
  }
}

export interface ImportResult {
  fields: FieldDef[];
  items: Item[];
  newFieldLabels: string[];
  skippedRows: number;
}

/**
 * Arma las piezas a partir de la planilla. Las columnas marcadas como "campo
 * nuevo" se agregan a la colección, y los valores de listas que no existían se
 * suman como opciones, así no se pierde ningún dato.
 */
export function buildImport(table: Table, mapping: ColumnTarget[], collection: Collection): ImportResult {
  const fields: FieldDef[] = collection.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined }));
  const used = new Set(fields.map((f) => f.id));
  const newFieldLabels: string[] = [];

  const columnField = mapping.map((target): FieldDef | null => {
    if (target.kind === 'field') return fields.find((f) => f.id === target.fieldId) ?? null;
    if (target.kind !== 'new') return null;
    const label = target.label.trim() || 'Campo';
    const field: FieldDef = {
      id: uniqueFieldId(label, used),
      label,
      type: target.type,
      options: target.type === 'select' ? [] : undefined,
    };
    fields.push(field);
    newFieldLabels.push(label);
    return field;
  });

  const titleCol = mapping.findIndex((t) => t.kind === 'title');
  const quantityCol = mapping.findIndex((t) => t.kind === 'quantity');
  const notesCol = mapping.findIndex((t) => t.kind === 'notes');

  const now = Date.now();
  const items: Item[] = [];
  let skippedRows = 0;

  table.rows.forEach((row, index) => {
    const values: Record<string, FieldValue> = {};
    columnField.forEach((field, col) => {
      if (!field) return;
      const value = toFieldValue(row[col] ?? null, field);
      if (value === null || value === '') return;
      values[field.id] = value;
      if (field.type === 'select' && typeof value === 'string' && field.options) {
        if (!field.options.some((o) => normalize(o) === normalize(value))) field.options.push(value);
      }
    });

    let title = titleCol >= 0 && row[titleCol] !== null ? String(row[titleCol]).trim() : '';
    if (!title) {
      title = columnField
        .map((f) => (f ? values[f.id] : null))
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .slice(0, 2)
        .join(' · ');
    }
    const notes = notesCol >= 0 && row[notesCol] !== null ? String(row[notesCol]).trim() : '';
    if (!title && !notes && Object.keys(values).length === 0) {
      skippedRows += 1;
      return;
    }
    const quantity = quantityCol >= 0 ? parseNumber(row[quantityCol]) : null;

    items.push({
      id: createId(),
      collectionId: collection.id,
      title: title || 'Sin nombre',
      photos: [],
      quantity: quantity !== null && quantity >= 1 ? Math.floor(quantity) : 1,
      values,
      notes,
      // Conserva el orden de la planilla al ordenar por "más recientes".
      createdAt: now - index,
      updatedAt: now,
    });
  });

  return { fields, items, newFieldLabels, skippedRows };
}
