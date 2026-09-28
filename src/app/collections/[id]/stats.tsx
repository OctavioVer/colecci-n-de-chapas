import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyBoxScene } from '@/components/illustrations/scenes';
import { EmptyState } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Screen, TopBar } from '@/components/ui/layout';
import { Card } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { facetValues } from '@/domain/search';
import { computeStats, formatCount } from '@/domain/stats';
import { getTemplate } from '@/domain/templates';
import type { FieldDef } from '@/domain/types';
import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

const TOP = 8;

export default function StatsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useStore((s) => s.collections.find((c) => c.id === id));
  const allItems = useStore((s) => s.items);
  const setActive = useStore((s) => s.setActiveCollection);
  const items = useMemo(() => allItems.filter((i) => i.collectionId === id), [allItems, id]);
  const stats = computeStats(items);

  if (!collection) return null;
  const template = getTemplate(collection.templateId);
  const photoPct = stats.unique ? Math.round((stats.withPhoto / stats.unique) * 100) : 0;

  const openFiltered = (field: FieldDef, value: string) => {
    setActive(collection.id);
    router.dismissTo({ pathname: '/collection', params: { field: field.id, value } });
  };

  return (
    <Screen header={<TopBar title="Conteos" subtitle={collection.name} />}>
      <View style={styles.tiles}>
        <Tile label={`${template.itemNounPlural} en total`} value={formatCount(stats.total)} tint={colors.primary} />
        <Tile label="Distintas" value={formatCount(stats.unique)} />
        <Tile label="Repetidas" value={formatCount(stats.duplicates)} />
        <Tile label="Con foto" value={`${photoPct}%`} />
      </View>

      {items.length === 0 ? (
        <EmptyState
          illustration={<EmptyBoxScene />}
          title="Todavía no hay nada para contar"
          message={`Cuando cargues ${template.itemNounPlural}, acá vas a ver cuántas tenés por cada dato.`}
        />
      ) : (
        <View style={{ gap: space.lg, marginTop: space.xl }}>
          <Text variant="caption" color="textTertiary">
            Tocá cualquier barra para ver esas piezas.
          </Text>
          {collection.fields.map((field) => (
            <FieldBreakdown key={field.id} field={field} items={items} color={collection.color} onSelect={(v) => openFiltered(field, v)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Tile({ label, value, tint }: { label: string; value: string; tint?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.tile, { backgroundColor: tint ?? colors.surface, borderColor: tint ?? colors.border }]}>
      <Text variant="number" style={{ color: tint ? colors.onPrimary : colors.text }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: tint ? colors.onPrimary : colors.textSecondary, opacity: tint ? 0.85 : 1 }}>
        {label}
      </Text>
    </View>
  );
}

function FieldBreakdown({
  field,
  items,
  color,
  onSelect,
}: {
  field: FieldDef;
  items: ReturnType<typeof useStore.getState>['items'];
  color: string;
  onSelect: (value: string) => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const facets = useMemo(() => facetValues(items, field), [items, field]);
  if (facets.length === 0) return null;
  const withValue = facets.reduce((n, f) => n + f.count, 0);
  const visible = expanded ? facets : facets.slice(0, TOP);
  const max = facets[0].count;

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.cardHeader}>
        <Text variant="heading" style={{ flex: 1 }}>
          {field.label}
        </Text>
        <Text variant="caption" color="textTertiary">
          {facets.length} {facets.length === 1 ? 'valor' : 'valores'} · {formatCount(withValue)} cargadas
        </Text>
      </View>
      {visible.map((f) => (
        <Pressable
          key={f.value}
          accessibilityRole="button"
          accessibilityLabel={`${f.value}: ${f.count}. Ver estas piezas`}
          onPress={() => onSelect(f.value)}
          style={({ pressed }) => [styles.bar, pressed && { opacity: 0.6 }]}>
          <View style={styles.barLabel}>
            <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
              {f.value}
            </Text>
            <Text variant="label" color="textSecondary">
              {formatCount(f.count)}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.fill, { width: `${Math.max(3, (f.count / max) * 100)}%`, backgroundColor: color }]} />
          </View>
        </Pressable>
      ))}
      {facets.length > TOP && (
        <Pressable accessibilityRole="button" onPress={() => setExpanded(!expanded)} style={styles.more}>
          <Text variant="label" color="primary">
            {expanded ? 'Ver menos' : `Ver los ${facets.length}`}
          </Text>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="primary" />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
  tile: { flexBasis: '47%', flexGrow: 1, padding: space.lg, borderRadius: radius.xl, borderWidth: 1, gap: space.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  bar: { gap: 6 },
  barLabel: { flexDirection: 'row', gap: space.md },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  more: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start' },
});
