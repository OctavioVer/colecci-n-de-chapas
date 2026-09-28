export type FieldType = 'text' | 'number' | 'select' | 'boolean';

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  /** Opciones para los campos de tipo `select`. */
  options?: string[];
  /** Texto de ayuda que se muestra debajo del campo al cargar una pieza. */
  hint?: string;
}

export type FieldValue = string | number | boolean | null;

export interface Collection {
  id: string;
  name: string;
  templateId: string;
  /** Color de acento de la colección (hex). */
  color: string;
  fields: FieldDef[];
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: string;
  collectionId: string;
  title: string;
  photos: string[];
  /** Cantidad de ejemplares. Todo lo que pase de 1 son repetidas. */
  quantity: number;
  values: Record<string, FieldValue>;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  /** Nombre de la pieza en singular, para textos como "Agregar chapa". */
  itemNoun: string;
  itemNounPlural: string;
  description: string;
  icon: string;
  color: string;
  titleHint: string;
  fields: Omit<FieldDef, 'id'>[];
}
