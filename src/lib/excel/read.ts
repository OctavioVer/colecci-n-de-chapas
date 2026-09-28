import readXlsxFile from 'read-excel-file/universal';

import { parseCsv } from './csv';

export type RawCell = string | number | boolean | null;

export interface Table {
  headers: string[];
  rows: RawCell[][];
}

export type SpreadsheetSource =
  | { kind: 'csv'; text: string }
  | { kind: 'xlsx'; bytes: Uint8Array };

export function isCsvFile(name: string, mimeType?: string | null): boolean {
  return /\.(csv|txt)$/i.test(name) || mimeType === 'text/csv';
}

function toRawCell(value: unknown): RawCell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

const isEmptyRow = (row: RawCell[]) => row.every((c) => c === null);

/**
 * Convierte una grilla cruda en encabezados + filas. Toma como encabezado la
 * primera fila que tenga al menos dos celdas con texto, así se saltean los
 * títulos que mucha gente pone arriba de la planilla.
 */
export function toTable(grid: unknown[][]): Table {
  const rows = grid.map((r) => r.map(toRawCell));
  let headerIndex = rows.findIndex((r) => r.filter((c) => c !== null).length >= 2);
  if (headerIndex === -1) headerIndex = rows.findIndex((r) => !isEmptyRow(r));
  if (headerIndex === -1) return { headers: [], rows: [] };

  const headerRow = rows[headerIndex];
  const width = Math.max(...rows.slice(headerIndex).map((r) => r.length));
  const seen = new Map<string, number>();
  const headers = Array.from({ length: width }, (_, i) => {
    const base = headerRow[i] === null || headerRow[i] === undefined ? `Columna ${i + 1}` : String(headerRow[i]);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base} (${n})` : base;
  });

  const body = rows
    .slice(headerIndex + 1)
    .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? null))
    .filter((r) => !isEmptyRow(r));

  // Descarta columnas sin encabezado ni datos (bordes o formato sobrante).
  const keep = headers.map(
    (h, i) => !h.startsWith('Columna ') || body.some((r) => r[i] !== null),
  );
  return {
    headers: headers.filter((_, i) => keep[i]),
    rows: body.map((r) => r.filter((_, i) => keep[i])),
  };
}

export async function readSpreadsheet(source: SpreadsheetSource): Promise<Table> {
  if (source.kind === 'csv') return toTable(parseCsv(source.text));

  const copy = source.bytes.slice();
  const sheets = await readXlsxFile(copy.buffer as ArrayBuffer);
  // Usa la primera hoja que tenga datos (la planilla modelo trae una hoja de instrucciones al final).
  for (const sheet of sheets) {
    const table = toTable(sheet.data as unknown[][]);
    if (table.headers.length > 0 && table.rows.length > 0) return table;
  }
  return sheets.length > 0 ? toTable(sheets[0].data as unknown[][]) : { headers: [], rows: [] };
}
