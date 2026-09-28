import { Pressable, StyleSheet, View } from 'react-native';

import { TEMPLATES } from '@/domain/templates';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { Icon, type IconName } from './ui/icon';
import { Text } from './ui/text';

export function TemplatePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {TEMPLATES.map((t) => {
        const selected = t.id === value;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${t.name}. ${t.description}`}
            onPress={() => onChange(t.id)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                borderColor: selected ? t.color : colors.border,
                borderWidth: selected ? 2 : 1,
              },
            ]}>
            <View style={styles.top}>
              <View style={[styles.icon, { backgroundColor: t.color }]}>
                <Icon name={t.icon as IconName} size={22} tint="#FFFFFF" />
              </View>
              <View style={[styles.radio, { borderColor: selected ? t.color : colors.borderStrong }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: t.color }]} />}
              </View>
            </View>
            <Text variant="subheading">{t.name}</Text>
            <Text variant="caption" color="textSecondary">
              {t.description}
            </Text>
            <Text variant="caption" color="textTertiary" numberOfLines={2} style={{ marginTop: space.xs }}>
              {t.fields.length > 2 ? t.fields.slice(0, 4).map((f) => f.label).join(' · ') + '…' : 'Campos a tu medida'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.xl, padding: space.lg, gap: space.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
