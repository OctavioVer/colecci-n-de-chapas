import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { displayValue, normalize } from '@/domain/search';
import type { Collection, Item } from '@/domain/types';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { CrownCap, shade } from './illustrations/crown-cap';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

const COLOR_NAMES: Record<string, string> = {
  blanco: '#F2F0EB',
  negro: '#26272B',
  rojo: '#D9412B',
  azul: '#2F6FDB',
  verde: '#1E9E6A',
  amarillo: '#F2C230',
  naranja: '#EE7A2B',
  dorado: '#C9A13B',
  plateado: '#A9AEB6',
  marron: '#7A5C3E',
  violeta: '#8A4FD8',
  rosa: '#E0679A',
  celeste: '#5DB7E8',
  gris: '#8D9097',
};

/**
 * Color para dibujar la pieza cuando no tiene foto: si tiene cargado un campo
 * de color (por ejemplo "Color de fondo"), usa ese; si no, el de la colección.
 */
export function placeholderColor(item: Item, collection?: Collection): string {
  const colorField = collection?.fields.find((f) => normalize(f.label).startsWith('color'));
  const value = colorField ? item.values[colorField.id] : undefined;
  const hex = typeof value === 'string' ? COLOR_NAMES[normalize(value)] : undefined;
  return hex ?? shade(collection?.color ?? '#D9412B', 0.35);
}

/** Resumen corto de una pieza con sus dos primeros datos cargados. */
export function itemSubtitle(item: Item, collection?: Collection): string {
  if (!collection) return '';
  return collection.fields
    .map((f) => displayValue(item.values[f.id]))
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
}

export function ItemThumb({ item, collection, size }: { item: Item; collection?: Collection; size?: number }) {
  const colors = useColors();
  const uri = item.photos[0];
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.thumbImage, size ? { width: size, height: size } : null]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={[
        styles.thumbPlaceholder,
        { backgroundColor: colors.surfaceMuted },
        size ? { width: size, height: size } : null,
      ]}>
      <CrownCap size={size ? size * 0.55 : 64} color={placeholderColor(item, collection)} />
    </View>
  );
}

export function ItemCard({ item, collection }: { item: Item; collection?: Collection }) {
  const colors = useColors();
  const subtitle = itemSubtitle(item, collection);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.quantity > 1 ? `, ${item.quantity} ejemplares` : ''}`}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}>
      <View style={styles.cardThumb}>
        <ItemThumb item={item} collection={collection} />
        {item.quantity > 1 && (
          <View style={[styles.qty, { backgroundColor: colors.ink }]}>
            <Text variant="caption" style={{ color: colors.onInk, fontFamily: 'PlusJakartaSans_700Bold' }}>
              ×{item.quantity}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text variant="label" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle || 'Sin datos cargados'}
        </Text>
      </View>
    </Pressable>
  );
}

export function ItemRow({ item, collection }: { item: Item; collection?: Collection }) {
  const colors = useColors();
  const subtitle = itemSubtitle(item, collection);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfacePressed : colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.rowThumb}>
        <ItemThumb item={item} collection={collection} size={56} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle || 'Sin datos cargados'}
        </Text>
      </View>
      {item.quantity > 1 && (
        <View style={[styles.rowQty, { backgroundColor: colors.surfaceMuted }]}>
          <Text variant="label">×{item.quantity}</Text>
        </View>
      )}
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  cardThumb: { aspectRatio: 1, width: '100%' },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  qty: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  cardBody: { padding: space.md, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    paddingRight: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowThumb: { width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden' },
  rowQty: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill },
});
