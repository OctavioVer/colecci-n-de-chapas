import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function haptic(kind: 'light' | 'success' | 'warning' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityHint,
}: ButtonProps) {
  const colors = useColors();
  const palette = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: 'transparent' },
    secondary: { bg: colors.surface, pressed: colors.surfacePressed, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', pressed: colors.surfaceMuted, fg: colors.text, border: 'transparent' },
    danger: { bg: colors.dangerSoft, pressed: colors.surfacePressed, fg: colors.danger, border: 'transparent' },
    ink: { bg: colors.ink, pressed: colors.ink, fg: colors.onInk, border: 'transparent' },
  }[variant];
  const height = { sm: 36, md: 48, lg: 56 }[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => {
        if (variant === 'primary') haptic('light');
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: size === 'sm' ? space.md : space.xl,
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} tint={palette.fg} />}
          <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} style={{ color: palette.fg }} numberOfLines={1}>
            {label}
          </Text>
          {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 20} tint={palette.fg} />}
        </View>
      )}
    </Pressable>
  );
}

export interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'surface' | 'ghost' | 'primary';
  size?: number;
  badge?: number;
}

export function IconButton({ icon, label, onPress, variant = 'surface', size = 44, badge }: IconButtonProps) {
  const colors = useColors();
  const bg = { surface: colors.surface, ghost: 'transparent', primary: colors.primary }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          backgroundColor: pressed ? colors.surfacePressed : bg,
          borderColor: variant === 'surface' ? colors.border : 'transparent',
        },
      ]}>
      <Icon name={icon} size={size * 0.45} tint={variant === 'primary' ? colors.onPrimary : colors.text} />
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text variant="caption" style={{ color: colors.onPrimary, fontSize: 10, lineHeight: 12 }}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
