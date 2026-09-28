import { createId, slugify } from './id';
import type { Collection, FieldDef, Template } from './types';

const CONDITION = ['Sin usar', 'Excelente', 'Muy bueno', 'Bueno', 'Regular', 'Dañado'];
const COLORS = [
  'Blanco',
  'Negro',
  'Rojo',
  'Azul',
  'Verde',
  'Amarillo',
  'Naranja',
  'Dorado',
  'Plateado',
  'Marrón',
  'Violeta',
  'Rosa',
  'Multicolor',
];

export const TEMPLATES: Template[] = [
  {
    id: 'chapas',
    name: 'Chapas',
    itemNoun: 'chapa',
    itemNounPlural: 'chapas',
    description: 'Tapitas corona de cervezas, gaseosas y más.',
    icon: 'beer-outline',
    color: '#D9412B',
    titleHint: 'Ej: Quilmes Cristal',
    fields: [
      { label: 'Marca', type: 'text' },
      { label: 'País', type: 'text' },
      {
        label: 'Bebida',
        type: 'select',
        options: ['Cerveza', 'Gaseosa', 'Agua', 'Jugo', 'Energizante', 'Sidra', 'Otra'],
      },
      { label: 'Color de fondo', type: 'select', options: COLORS },
      { label: 'Color del texto', type: 'select', options: COLORS },
      { label: 'Texto / leyenda', type: 'text', hint: 'Lo que dice la chapa, tal cual.' },
      { label: 'Interior', type: 'select', options: ['Plástico', 'Corcho', 'Sin interior'] },
      { label: 'Año', type: 'number' },
      { label: 'Estado', type: 'select', options: CONDITION },
    ],
  },
  {
    id: 'latas',
    name: 'Latas',
    itemNoun: 'lata',
    itemNounPlural: 'latas',
    description: 'Latas de cerveza, gaseosa y ediciones especiales.',
    icon: 'cafe-outline',
    color: '#2F6FDB',
    titleHint: 'Ej: Brahma edición Mundial 2022',
    fields: [
      { label: 'Marca', type: 'text' },
      { label: 'País', type: 'text' },
      { label: 'Bebida', type: 'select', options: ['Cerveza', 'Gaseosa', 'Energizante', 'Agua', 'Otra'] },
      { label: 'Capacidad (ml)', type: 'number' },
      { label: 'Edición', type: 'text', hint: 'Edición limitada, promoción, etc.' },
      { label: 'Año', type: 'number' },
      { label: 'Abierta', type: 'boolean' },
      { label: 'Estado', type: 'select', options: CONDITION },
    ],
  },
  {
    id: 'biromes',
    name: 'Biromes',
    itemNoun: 'birome',
    itemNounPlural: 'biromes',
    description: 'Lapiceras, biromes publicitarias y de colección.',
    icon: 'pencil-outline',
    color: '#1E9E7A',
    titleHint: 'Ej: Bic Cristal azul',
    fields: [
      { label: 'Marca', type: 'text' },
      { label: 'Modelo', type: 'text' },
      { label: 'País', type: 'text' },
      { label: 'Color de tinta', type: 'select', options: ['Azul', 'Negro', 'Rojo', 'Verde', 'Otro'] },
      { label: 'Mecanismo', type: 'select', options: ['Capuchón', 'Retráctil', 'Giratorio', 'Otro'] },
      { label: 'Publicidad', type: 'text', hint: 'Si tiene impresa una marca o empresa.' },
      { label: 'Año', type: 'number' },
      { label: 'Funciona', type: 'boolean' },
      { label: 'Estado', type: 'select', options: CONDITION },
    ],
  },
  {
    id: 'personalizada',
    name: 'Otra colección',
    itemNoun: 'pieza',
    itemNounPlural: 'piezas',
    description: 'Empezá de cero y armá tus propios campos.',
    icon: 'sparkles-outline',
    color: '#8A4FD8',
    titleHint: 'Nombre o descripción de la pieza',
    fields: [
      { label: 'Año', type: 'number' },
      { label: 'Estado', type: 'select', options: CONDITION },
    ],
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}

export function buildFields(template: Template): FieldDef[] {
  const used = new Set<string>();
  return template.fields.map((f) => ({ ...f, id: uniqueFieldId(f.label, used) }));
}

export function uniqueFieldId(label: string, used: Set<string>): string {
  const base = slugify(label) || 'campo';
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}_${n++}`;
  used.add(id);
  return id;
}

export function newCollection(templateId: string, name?: string): Collection {
  const template = getTemplate(templateId);
  const now = Date.now();
  return {
    id: createId(),
    name: name?.trim() || `Mis ${template.itemNounPlural}`,
    templateId: template.id,
    color: template.color,
    fields: buildFields(template),
    createdAt: now,
    updatedAt: now,
  };
}
