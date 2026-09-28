import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { facetValues, type FieldFilter, type Query, type SortKey } from '@/domain/search';
import type { Collection, Item } from '@/domain/types';
import { parseNumber } from '@/lib/excel/mapping';
import { space } from '@/theme/tokens';

import { Button } from './ui/button';
import { SwitchRow, TextField } from './ui/inputs';
import { Sheet } from './ui/layout';
import { Chip, Divider } from './ui/surfaces';
import { Text } from './ui/text';

const MAX_VISIBLE = 12;

export function sortOptions(collection: Collection): { value: SortKey; label: string }[] {
  return [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguas' },
    { value: 'title', label: 'Nombre A-Z' },
    { value: 'quantity', label: 'Más repetidas' },
    ...collection.fields
      .filter((f) => f.type !== 'boolean')
      .map((f) => ({ value: `field:${f.id}` as SortKey, label: f.label })),
  ];
}

/**
 * Panel de filtros cruzados: se combinan todos los campos a la vez
 * (por ejemplo, "Cerveza" + "Argentina" + "Año 1990 a 2000").
 */
export function FiltersSheet({
  visible,
  onClose,
  collection,
  items,
  query,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  collection: Collection;
  items: Item[];
  query: Query;
  onApply: (q: Query) => void;
}) {
  const [draft, setDraft] = useState(query);
  const [expanded, setExpanded] = useState<string[]>([]);

  // Cada vez que se abre, arranca desde los filtros aplicados.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(query);
  }

  const setFilter = (fieldId: string, filter: FieldFilter | undefined) =>
    setDraft((d) => {
      const filters = { ...d.filters };
      if (filter) filters[fieldId] = filter;
      else delete filters[fieldId];
      return { ...d, filters };
    });

  const toggleValue = (fieldId: string, value: string) => {
    const current = draft.filters[fieldId];
    const values = current?.kind === 'values' ? current.values : [];
    const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    setFilter(fieldId, next.length ? { kind: 'values', values: next } : undefined);
  };

  const setRange = (fieldId: string, key: 'min' | 'max', text: string) => {
    const current = draft.filters[fieldId];
    const range = current?.kind === 'range' ? { ...current } : { kind: 'range' as const };
    const n = parseNumber(text);
    if (n === null) delete range[key];
    else range[key] = n;
    setFilter(fieldId, range.min === undefined && range.max === undefined ? undefined : range);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filtrar y ordenar"
      footer={
        <>
          <Button
            label="Limpiar"
            variant="secondary"
            onPress={() => setDraft({ ...draft, filters: {}, onlyDuplicates: false })}
            style={{ flex: 1 }}
          />
          <Button
            label="Ver resultados"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={{ flex: 2 }}
          />
        </>
      }>
      <View style={styles.section}>
        <Text variant="overline" color="textTertiary">
          Ordenar por
        </Text>
        <View style={styles.chips}>
          {sortOptions(collection).map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={draft.sort === o.value}
              onPress={() => setDraft({ ...draft, sort: o.value })}
            />
          ))}
        </View>
      </View>

      <SwitchRow
        label="Solo repetidas"
        value={!!draft.onlyDuplicates}
        onChange={(v) => setDraft({ ...draft, onlyDuplicates: v })}
      />

      {collection.fields.map((field) => {
        const current = draft.filters[field.id];
        if (field.type === 'number') {
          const range = current?.kind === 'range' ? current : undefined;
          return (
            <View key={field.id} style={styles.section}>
              <Divider />
              <Text variant="subheading" style={styles.fieldTitle}>
                {field.label}
              </Text>
              <View style={styles.range}>
                <View style={{ flex: 1 }}>
                  <TextField
                    placeholder="Desde"
                    keyboardType="numeric"
                    defaultValue={range?.min?.toString() ?? ''}
                    onChangeText={(t) => setRange(field.id, 'min', t)}
                  />
                </View>
                <Text variant="body" color="textTertiary">
                  –
                </Text>
                <View style={{ flex: 1 }}>
                  <TextField
                    placeholder="Hasta"
                    keyboardType="numeric"
                    defaultValue={range?.max?.toString() ?? ''}
                    onChangeText={(t) => setRange(field.id, 'max', t)}
                  />
                </View>
              </View>
            </View>
          );
        }
        const facets = facetValues(items, field);
        if (facets.length === 0) return null;
        const selected = current?.kind === 'values' ? current.values : [];
        const isExpanded = expanded.includes(field.id);
        const visibleFacets = isExpanded ? facets : facets.slice(0, MAX_VISIBLE);
        return (
          <View key={field.id} style={styles.section}>
            <Divider />
            <Text variant="subheading" style={styles.fieldTitle}>
              {field.label}
            </Text>
            <View style={styles.chips}>
              {visibleFacets.map((f) => (
                <Chip
                  key={f.value}
                  label={f.value}
                  count={f.count}
                  selected={selected.includes(f.value)}
                  onPress={() => toggleValue(field.id, f.value)}
                />
              ))}
              {facets.length > MAX_VISIBLE && (
                <Chip
                  label={isExpanded ? 'Ver menos' : `Ver ${facets.length - MAX_VISIBLE} más`}
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  onPress={() =>
                    setExpanded(isExpanded ? expanded.filter((id) => id !== field.id) : [...expanded, field.id])
                  }
                />
              )}
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginBottom: space.lg },
  fieldTitle: { marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  range: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
