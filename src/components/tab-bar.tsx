import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, MAX_CONTENT_WIDTH, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { haptic } from './ui/button';
import { Icon, type IconName } from './ui/icon';
import { Text } from './ui/text';

const TABS: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  index: { label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
  collection: { label: 'Colección', icon: 'grid-outline', activeIcon: 'grid' },
  community: { label: 'Comunidad', icon: 'people-outline', activeIcon: 'people' },
  profile: { label: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const tab = TABS[route.name];
    if (!tab) return null;
    const focused = state.index === index;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptic('light');
            navigation.navigate(route.name);
          }
        }}
        style={styles.tab}>
        <Icon name={focused ? tab.activeIcon : tab.icon} size={23} color={focused ? 'text' : 'textTertiary'} />
        <Text variant="caption" color={focused ? 'text' : 'textTertiary'} style={{ fontSize: 11 }}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }, elevation(colors, 2)]}>
        {renderTab(0)}
        {renderTab(1)}
        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar pieza"
            onPress={() => {
              haptic('light');
              router.push('/item/form');
            }}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
              elevation(colors, 2),
            ]}>
            <Icon name="add" size={30} tint={colors.onPrimary} />
          </Pressable>
        </View>
        {renderTab(2)}
        {renderTab(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    borderRadius: radius.xxl,
    borderWidth: 1,
    paddingHorizontal: space.xs,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%' },
  fabSlot: { width: 72, alignItems: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
});
