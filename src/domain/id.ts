export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Convierte una etiqueta en un identificador estable ("Tipo de bebida" → "tipo_de_bebida"). */
export function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
