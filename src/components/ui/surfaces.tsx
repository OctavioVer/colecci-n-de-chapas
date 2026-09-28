import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { elevation, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  raised?: boolean;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, padded = true, raised, accessibilityLabel }: CardProps) {
  const colors = useColors();
  const base = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    padded && styles.padded,
    raised && elevation(colors, 1),
  ];
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { backgroundColor: colors.surfacePressed }, style]}>
      {children}
    </Pressable>
  );
}

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  icon?: IconName;
  onRemove?: () => void;
  tint?: string;
}

export function Chip({ label, selected, onPress, count, icon, onRemove, tint }: ChipProps) {
  const colors = useColors();
  const activeBg = tint ?? colors.ink;
  const fg = selected ? (tint ? '#FFFFFF' : colors.onInk) : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      onPress={onPress ?? onRemove}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? activeBg : pressed ? colors.surfacePressed : colors.surface,
          borderColor: selected ? activeBg : colors.border,
        },
      ]}>
      {icon && <Icon name={icon} size={15} tint={fg} />}
      <Text variant="label" style={{ color: fg, flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined && (
        <Text variant="caption" style={{ color: selected ? fg : colors.textTertiary, opacity: selected ? 0.75 : 1 }}>
          {count}
        </Text>
      )}
      {onRemove && <Icon name="close" size={15} tint={fg} />}
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' | 'success' | 'accent' }) {
  const colors = useColors();
  const map = {
    neutral: [colors.surfaceMuted, colors.textSecondary],
    primary: [colors.primarySoft, colors.primary],
    success: [colors.successSoft, colors.success],
    accent: [colors.accentSoft, colors.accent],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ color: fg, fontFamily: 'PlusJakartaSans_700Bold' }}>
        {label}
      </Text>
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />;
}

export interface ListRowProps {
  icon?: IconName;
  iconTint?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  right?: ReactNode;
}

export function ListRow({ icon, iconTint, title, subtitle, value, onPress, destructive, right }: ListRowProps) {
  const colors = useColors();
  const content = (
    <>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted }]}>
          <Icon name={icon} size={18} tint={destructive ? colors.danger : (iconTint ?? colors.text)} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={destructive && { color: colors.danger }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="label" color="textSecondary">
          {value}
        </Text>
      )}
      {right}
      {onPress && !right && <Icon name="chevron-forward" size={18} color="textTertiary" />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfacePressed }]}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="heading">{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text variant="label" color="primary">
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function ProgressBar({ value, tint }: { value: number; tint?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, backgroundColor: tint ?? colors.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  padded: { padding: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    height: 36,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 56,
  },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
