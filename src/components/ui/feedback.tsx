import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export function EmptyState({
  illustration,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  illustration?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.empty}>
      {illustration}
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="body" color="textSecondary" align="center" style={styles.emptyMessage}>
        {message}
      </Text>
      {actionLabel && <Button label={actionLabel} onPress={onAction} icon="add" style={{ marginTop: space.sm }} />}
      {secondaryLabel && <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" size="sm" />}
    </View>
  );
}

/**
 * Consejo contextual que aparece la primera vez que el usuario entra a una
 * pantalla. Una vez cerrado no vuelve a aparecer (se guarda por `id`).
 */
export function Tip({ id, icon = 'bulb-outline', title, message }: { id: string; icon?: IconName; title: string; message: string }) {
  const colors = useColors();
  const dismissed = useStore((s) => s.dismissedTips.includes(id));
  const dismiss = useStore((s) => s.dismissTip);
  if (dismissed) return null;
  return (
    <View style={[styles.tip, { backgroundColor: colors.accentSoft }]} accessibilityRole="summary">
      <View style={[styles.tipIcon, { backgroundColor: colors.accent }]}>
        <Icon name={icon} size={18} tint="#FFFFFF" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="label" color="textSecondary" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          {message}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Entendido, cerrar consejo" onPress={() => dismiss(id)} hitSlop={10}>
        <Icon name="close" size={18} color="textSecondary" />
      </Pressable>
    </View>
  );
}

/** Confirmación que funciona igual en el celular y en la web. */
export function confirm({
  title,
  message,
  confirmLabel,
  destructive,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]),
  );
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  emptyMessage: { maxWidth: 320 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.xl,
    marginBottom: space.xl,
  },
  tipIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
