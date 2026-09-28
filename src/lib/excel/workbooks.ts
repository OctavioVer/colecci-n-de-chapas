import { displayValue } from '@/domain/search';
import { getTemplate } from '@/domain/templates';
import type { Collection, FieldDef, Item } from '@/domain/types';

import { buildXlsx, type CellValue, type SheetSpec } from './xlsx-writer';

const FIXED_BEFORE = ['Nombre', 'Cantidad'];
const FIXED_AFTER = ['Notas'];

function headerRow(collection: Collection): string[] {
  return [...FIXED_BEFORE, ...collection.fields.map((f) => f.label), ...FIXED_AFTER];
}

function widths(headers: string[]): number[] {
  return headers.map((h, i) => (i === 0 ? 32 : Math.max(12, Math.min(40, h.length + 6))));
}

function dropdowns(fields: FieldDef[]): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  fields.forEach((f, i) => {
    const col = FIXED_BEFORE.length + i;
    if (f.type === 'select' && f.options?.length) result[col] = f.options;
    if (f.type === 'boolean') result[col] = ['Sí', 'No'];
  });
  return result;
}

function describeType(field: FieldDef): string {
  switch (field.type) {
    case 'number':
      return 'Número';
    case 'boolean':
      return 'Sí / No';
    case 'select':
      return `Lista: ${field.options?.join(', ') || '(valores libres)'}`;
    default:
      return 'Texto libre';
  }
}

/**
 * Planilla modelo para completar y volver a subir (como hace Banco Roela).
 * La primera hoja tiene las columnas de la colección con listas desplegables
 * y la segunda explica qué va en cada una.
 */
export function buildTemplateWorkbook(collection: Collection): Uint8Array {
  const template = getTemplate(collection.templateId);
  const headers = headerRow(collection);
  const guide: CellValue[][] = [
    ['Columna', 'Qué cargar'],
    ['Nombre', `Obligatorio. ${template.titleHint}.`],
    ['Cantidad', 'Cuántos ejemplares tenés. Si lo dejás vacío se toma 1.'],
    ...collection.fields.map((f) => [f.label, describeType(f)]),
    ['Notas', 'Cualquier comentario extra.'],
    [],
    ['Cómo usarla', ''],
    ['1.', 'Completá una fila por pieza en la hoja "Colección". No cambies los encabezados.'],
    ['2.', 'Guardá el archivo como Excel (.xlsx) o CSV.'],
    ['3.', 'En la app, entrá a tu colección → Importar Excel y elegí el archivo.'],
  ];
  const sheets: SheetSpec[] = [
    { name: 'Colección', rows: [headers], header: true, columnWidths: widths(headers), dropdowns: dropdowns(collection.fields) },
    { name: 'Instrucciones', rows: guide, header: true, columnWidths: [22, 90] },
  ];
  return buildXlsx(sheets);
}

export function buildExportWorkbook(collection: Collection, items: Item[]): Uint8Array {
  const headers = headerRow(collection);
  const rows: CellValue[][] = items.map((item) => [
    item.title,
    item.quantity,
    ...collection.fields.map((f) => {
      const v = item.values[f.id];
      return typeof v === 'boolean' ? displayValue(v) : v;
    }),
    item.notes,
  ]);
  return buildXlsx([
    {
      name: collection.name,
      rows: [headers, ...rows],
      header: true,
      columnWidths: widths(headers),
      dropdowns: dropdowns(collection.fields),
    },
  ]);
}

export function fileSafeName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'coleccion'
  );
}
