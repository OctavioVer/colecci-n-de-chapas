/**
 * Lector de CSV que respeta comillas y saltos de línea dentro de celdas.
 * Detecta solo el separador: Excel en español suele exportar con ";".
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const delimiter = detectDelimiter(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/**
 * Mira las primeras líneas (no solo la primera: muchas planillas tienen un
 * título arriba) y elige el separador que más aparece.
 */
function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/, 20).join('\n');
  const candidates = [';', ',', '\t'];
  let best = ',';
  let bestCount = 0;
  for (const c of candidates) {
    const count = sample.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}
