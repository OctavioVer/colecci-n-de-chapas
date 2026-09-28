import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import { CollectionSwitcher } from '@/components/collection-switcher';
import { GettingStarted } from '@/components/getting-started';
import { CapShape } from '@/components/illustrations/crown-cap';
import { EmptyBoxScene } from '@/components/illustrations/scenes';
import { ItemCard } from '@/components/item-views';
import { EmptyState } from '@/components/ui/feedback';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { Card, ProgressBar, SectionTitle } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { facetValues } from '@/domain/search';
import { computeStats, formatCount } from '@/domain/stats';
import { getTemplate } from '@/domain/templates';
import { useActiveCollection, useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const colors = useColors();
  const collection = useActiveCollection();
  const allItems = useStore((s) => s.items);
  const profileName = useStore((s) => s.profileName);

  const items = useMemo(
    () => allItems.filter((i) => i.collectionId === collection?.id),
    [allItems, collection?.id],
  );
  const stats = useMemo(() => computeStats(items), [items]);
  const recent = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8), [items]);

  // Muestra el reparto por el primer campo que tenga datos (país, marca, etc.).
  const breakdown = useMemo(() => {
    if (!collection) return null;
    for (const field of collection.fields) {
      if (field.type === 'number' || field.type === 'boolean') continue;
      const facets = facetValues(items, field);
      if (facets.length >= 2) return { field, facets: facets.slice(0, 4) };
    }
    return null;
  }, [collection, items]);

  if (!collection) {
    return (
      <Screen withTabBar>
        <EmptyState
          illustration={<EmptyBoxScene />}
          title="No tenés colecciones"
          message="Creá una para empezar a cargar tus piezas."
          actionLabel="Crear colección"
          onAction={() => router.push('/collections/new')}
        />
      </Screen>
    );
  }

  const template = getTemplate(collection.templateId);
  const firstName = profileName.split(' ')[0];

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="textSecondary">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text variant="title">Tu vitrina</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir al perfil"
          onPress={() => router.navigate('/profile')}
          style={[styles.avatar, { backgroundColor: colors.ink }]}>
          <Text variant="subheading" style={{ color: colors.onInk }}>
            {(firstName[0] ?? 'V').toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <CollectionSwitcher activeId={collection.id} />

      <View style={[styles.hero, { backgroundColor: colors.ink }]}>
        <Svg width={150} height={110} viewBox="0 0 150 110" style={styles.heroArt} pointerEvents="none">
          <CapShape x={44} y={-26} size={120} color={collection.color} mark="star" opacity={0.9} />
          <CapShape x={4} y={38} size={48} color="#E8A33D" mark="dot" markColor="#1F2430" opacity={0.6} />
        </Svg>
        <Text variant="overline" style={{ color: colors.onInk, opacity: 0.7 }}>
          {collection.name}
        </Text>
        <View style={styles.heroNumber}>
          <Text variant="display" style={{ color: colors.onInk, fontSize: 44, lineHeight: 50 }}>
            {formatCount(stats.total)}
          </Text>
          <Text variant="bodyStrong" style={{ color: colors.onInk, opacity: 0.8, marginBottom: 8 }}>
            {stats.total === 1 ? template.itemNoun : template.itemNounPlural}
          </Text>
        </View>
        <View style={styles.heroStats}>
          <HeroStat label="Distintas" value={stats.unique} />
          <View style={[styles.heroDivider, { backgroundColor: colors.onInk }]} />
          <HeroStat label="Repetidas" value={stats.duplicates} />
          <View style={[styles.heroDivider, { backgroundColor: colors.onInk }]} />
          <HeroStat label="Con foto" value={stats.withPhoto} />
        </View>
      </View>

      <View style={styles.actions}>
        <QuickAction icon="add" label="Agregar" onPress={() => router.push('/item/form')} primary />
        <QuickAction
          icon="document-text-outline"
          label="Importar"
          onPress={() => router.push({ pathname: '/collections/[id]/import', params: { id: collection.id } })}
        />
        <QuickAction
          icon="stats-chart-outline"
          label="Conteos"
          onPress={() => router.push({ pathname: '/collections/[id]/stats', params: { id: collection.id } })}
        />
        <QuickAction
          icon="construct-outline"
          label="Campos"
          onPress={() => router.push({ pathname: '/collections/[id]/edit', params: { id: collection.id } })}
        />
      </View>

      <View style={styles.section}>
        <GettingStarted collection={collection} />
      </View>

      <View style={styles.section}>
        <SectionTitle
          title="Agregadas recientemente"
          action={items.length > 0 ? 'Ver todas' : undefined}
          onAction={() => router.navigate('/collection')}
        />
        {recent.length === 0 ? (
          <Card>
            <EmptyState
              illustration={<EmptyBoxScene width={150} />}
              title={`Todavía no cargaste ${template.itemNounPlural}`}
              message="Arrancá con una: sacale una foto y completá los datos que tengas a mano."
              actionLabel={`Agregar ${template.itemNoun}`}
              onAction={() => router.push('/item/form')}
            />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll} contentContainerStyle={styles.recent}>
            {recent.map((item) => (
              <View key={item.id} style={styles.recentCard}>
                <ItemCard item={item} collection={collection} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {breakdown && (
        <View style={styles.section}>
          <SectionTitle
            title={`Por ${breakdown.field.label.toLowerCase()}`}
            action="Ver conteos"
            onAction={() => router.push({ pathname: '/collections/[id]/stats', params: { id: collection.id } })}
          />
          <Card style={{ gap: space.lg }}>
            {breakdown.facets.map((f) => (
              <View key={f.value} style={{ gap: space.sm }}>
                <View style={styles.breakdownRow}>
                  <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {f.value}
                  </Text>
                  <Text variant="label" color="textSecondary">
                    {formatCount(f.count)}
                  </Text>
                </View>
                <ProgressBar value={f.count / breakdown.facets[0].count} tint={collection.color} />
              </View>
            ))}
          </Card>
        </View>
      )}

    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1 }}>
      <Text variant="heading" style={{ color: colors.onInk }}>
        {formatCount(value)}
      </Text>
      <Text variant="caption" style={{ color: colors.onInk, opacity: 0.65 }}>
        {label}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}>
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.actionIcon,
              {
                backgroundColor: primary ? colors.primary : pressed ? colors.surfacePressed : colors.surface,
                borderColor: primary ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}>
            <Icon name={icon} size={24} tint={primary ? colors.onPrimary : colors.text} />
          </View>
          <Text variant="caption" color="textSecondary">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: space.lg, paddingBottom: space.xl },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.xxl, padding: space.xxl, overflow: 'hidden' },
  heroArt: { position: 'absolute', right: -24, top: 0 },
  heroNumber: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginTop: space.xs },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl, gap: space.md },
  heroDivider: { width: 1, height: 28, opacity: 0.15 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xl },
  action: { alignItems: 'center', gap: space.sm, flex: 1 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: space.xxl },
  recentScroll: { marginHorizontal: -space.xl },
  recent: { gap: space.md, paddingHorizontal: space.xl },
  recentCard: { width: 148 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
