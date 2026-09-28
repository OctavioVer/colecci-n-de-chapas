import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useStore } from '@/store/store';
import { space } from '@/theme/tokens';

import { Chip } from './ui/surfaces';

/** Cambia entre colecciones. Solo aparece si hay más de una. */
export function CollectionSwitcher({ activeId }: { activeId: string }) {
  const collections = useStore((s) => s.collections);
  const setActive = useStore((s) => s.setActiveCollection);
  if (collections.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {collections.map((c) => (
        <Chip key={c.id} label={c.name} selected={c.id === activeId} tint={c.color} onPress={() => setActive(c.id)} />
      ))}
      <Chip label="Nueva" icon="add" onPress={() => router.push('/collections/new')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -space.xl, marginBottom: space.lg, flexGrow: 0 },
  row: { gap: space.sm, paddingHorizontal: space.xl },
});
