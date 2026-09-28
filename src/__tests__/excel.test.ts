import { describe, expect, it } from '@jest/globals';
import { strFromU8, unzipSync } from 'fflate';

import { newCollection } from '@/domain/templates';
import { parseCsv } from '@/lib/excel/csv';
import { autoMap, buildImport, parseNumber } from '@/lib/excel/mapping';
import { readSpreadsheet, toTable } from '@/lib/excel/read';
import { buildExportWorkbook, buildTemplateWorkbook } from '@/lib/excel/workbooks';
import { buildXlsx, columnName } from '@/lib/excel/xlsx-writer';

describe('csv', () => {
  it('detecta punto y coma y respeta comillas', () => {
    expect(parseCsv('Nombre;Texto\r\n"Quilmes";"Dice ""hola""; y más"\n')).toEqual([
      ['Nombre', 'Texto'],
      ['Quilmes', 'Dice "hola"; y más'],
    ]);
  });

  it('detecta el separador aunque la primera línea sea un título', () => {
    const rows = parseCsv('Mis chapas, planilla de Juampi\n;;;\nNombre;País;Año;Serie\nQuilmes;Argentina;1998;A-01\n');
    expect(toTable(rows)).toEqual({
      headers: ['Nombre', 'País', 'Año', 'Serie'],
      rows: [['Quilmes', 'Argentina', '1998', 'A-01']],
    });
  });
});

describe('toTable', () => {
  it('saltea títulos arriba del encabezado y filas vacías', () => {
    const table = toTable([
      ['Mi colección de chapas'],
      [],
      ['Marca', 'País', null],
      ['Quilmes', 'Argentina', null],
      [null, null, null],
    ]);
    expect(table).toEqual({ headers: ['Marca', 'País'], rows: [['Quilmes', 'Argentina']] });
  });
});

describe('parseNumber', () => {
  it.each([
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    ['1998', 1998],
    ['12,5', 12.5],
    ['1.000.000', 1000000],
    ['abc', null],
  ])('%s → %s', (input, expected) => expect(parseNumber(input)).toBe(expected));
});

describe('xlsx', () => {
  it('nombra columnas como Excel', () => {
    expect([0, 25, 26, 701, 702].map(columnName)).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
  });

  it('la planilla modelo tiene encabezados y listas desplegables', () => {
    const files = unzipSync(buildTemplateWorkbook(newCollection('chapas')));
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
    expect(sheet).toContain('<t xml:space="preserve">Color de fondo</t>');
    expect(sheet).toContain('<formula1>"Cerveza,Gaseosa,Agua,Jugo,Energizante,Sidra,Otra"</formula1>');
    expect(strFromU8(files['xl/workbook.xml'])).toContain('name="Instrucciones"');
  });

  it('exporta y vuelve a importar sin perder datos', async () => {
    const collection = newCollection('chapas');
    const original = {
      id: 'a',
      collectionId: collection.id,
      title: 'Quilmes <Cristal> & Co',
      photos: [],
      quantity: 3,
      values: { marca: 'Quilmes', pais: 'Argentina', bebida: 'Cerveza', ano: 1998 },
      notes: 'Encontrada en San Telmo',
      createdAt: 0,
      updatedAt: 0,
    };
    const bytes = buildExportWorkbook(collection, [original]);
    const table = await readSpreadsheet({ kind: 'xlsx', bytes });
    const mapping = autoMap(table, collection);
    expect(mapping.every((m) => m.kind !== 'new' && m.kind !== 'ignore')).toBe(true);

    const result = buildImport(table, mapping, collection);
    expect(result.newFieldLabels).toEqual([]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: original.title,
      quantity: 3,
      notes: original.notes,
      values: original.values,
    });
  });
});

describe('importar un Excel propio', () => {
  it('mapea columnas conocidas y crea campos para las demás', async () => {
    const collection = newCollection('chapas');
    const bytes = buildXlsx([
      {
        name: 'Hoja1',
        rows: [
          ['Descripción', 'Marca', 'PAIS', 'Serie', 'Cant.', 'Bebida'],
          ['Brahma roja', 'Brahma', 'Brasil', 'A-12', '2', 'cerveza'],
          [null, 'Pepsi', 'Argentina', 'B-1', null, 'Limonada'],
          [null, null, null, null, null, null],
        ],
      },
    ]);
    const table = await readSpreadsheet({ kind: 'xlsx', bytes });
    const mapping = autoMap(table, collection);
    expect(mapping.map((m) => m.kind)).toEqual(['title', 'field', 'field', 'new', 'quantity', 'field']);

    const result = buildImport(table, mapping, collection);
    expect(result.newFieldLabels).toEqual(['Serie']);
    expect(result.items.map((i) => [i.title, i.quantity])).toEqual([
      ['Brahma roja', 2],
      ['Pepsi · Argentina', 1],
    ]);
    // Normaliza "cerveza" a la opción existente y agrega "Limonada" como opción nueva.
    expect(result.items[0].values.bebida).toBe('Cerveza');
    const bebida = result.fields.find((f) => f.id === 'bebida')!;
    expect(bebida.options).toContain('Limonada');
  });
});
