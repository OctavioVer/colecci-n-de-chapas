import { describe, expect, it } from '@jest/globals';
import { applyQuery, EMPTY_QUERY, facetValues } from '@/domain/search';
import { computeStats } from '@/domain/stats';
import { newCollection } from '@/domain/templates';
import type { Item } from '@/domain/types';

const collection = newCollection('chapas');
const item = (title: string, values: Item['values'], quantity = 1, createdAt = 0): Item => ({
  id: title,
  collectionId: collection.id,
  title,
  photos: [],
  quantity,
  values,
  notes: '',
  createdAt,
  updatedAt: createdAt,
});

const items = [
  item('Quilmes Cristal', { marca: 'Quilmes', pais: 'Argentina', bebida: 'Cerveza', ano: 1998 }, 3, 1),
  item('Coca-Cola', { marca: 'Coca-Cola', pais: 'México', bebida: 'Gaseosa', ano: 2005 }, 1, 2),
  item('Pilsen', { marca: 'Pilsen', pais: 'Uruguay', bebida: 'Cerveza', ano: 1985 }, 2, 3),
  item('Stella Artois', { marca: 'Stella', pais: 'argentina', bebida: 'Cerveza' }, 1, 4),
];

describe('applyQuery', () => {
  it('busca sin importar tildes ni mayúsculas en todos los campos', () => {
    const result = applyQuery(items, collection.fields, { ...EMPTY_QUERY, text: 'mexico' });
    expect(result.map((i) => i.title)).toEqual(['Coca-Cola']);
  });

  it('cruza filtros de distintos campos', () => {
    const result = applyQuery(items, collection.fields, {
      ...EMPTY_QUERY,
      filters: { bebida: { kind: 'values', values: ['Cerveza'] }, pais: { kind: 'values', values: ['Argentina'] } },
    });
    expect(result.map((i) => i.title).sort()).toEqual(['Quilmes Cristal', 'Stella Artois']);
  });

  it('filtra por rango numérico y descarta piezas sin dato', () => {
    const result = applyQuery(items, collection.fields, {
      ...EMPTY_QUERY,
      filters: { ano: { kind: 'range', min: 1990 } },
    });
    expect(result.map((i) => i.title).sort()).toEqual(['Coca-Cola', 'Quilmes Cristal']);
  });

  it('muestra solo repetidas y ordena por campo', () => {
    const dup = applyQuery(items, collection.fields, { ...EMPTY_QUERY, onlyDuplicates: true, sort: 'field:ano' });
    expect(dup.map((i) => i.title)).toEqual(['Pilsen', 'Quilmes Cristal']);
  });
});

describe('facetValues y stats', () => {
  it('agrupa valores equivalentes y cuenta', () => {
    const pais = collection.fields.find((f) => f.id === 'pais')!;
    expect(facetValues(items, pais)[0]).toEqual({ value: 'Argentina', count: 2 });
  });

  it('calcula totales y repetidas', () => {
    expect(computeStats(items)).toEqual({ unique: 4, total: 7, duplicates: 3, withPhoto: 0 });
  });
});
