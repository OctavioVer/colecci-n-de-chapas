import { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { haptic } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, icon, style, multiline, onFocus, onBlur, ...props },
  ref,
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.text : colors.border;
  return (
    <View style={styles.field}>
      {label && (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.surface, borderColor },
          multiline && styles.multiline,
        ]}>
        {icon && <Icon name={icon} size={18} color="textTertiary" />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, multiline && styles.multilineInput, style]}
          {...props}
        />
      </View>
      {(error || hint) && (
        <Text variant="caption" style={{ color: error ? colors.danger : colors.textTertiary }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
});

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name="search" size={18} color="textTertiary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Buscar"
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => onChangeText('')} hitSlop={8}>
          <Icon name="close-circle" size={18} color="textTertiary" />
        </Pressable>
      )}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  label?: string;
}) {
  const colors = useColors();
  const step = (delta: number) => {
    const next = Math.max(min, value + delta);
    if (next !== value) {
      haptic('light');
      onChange(next);
    }
  };
  return (
    <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Restar ${label ?? ''}`}
        onPress={() => step(-1)}
        disabled={value <= min}
        style={({ pressed }) => [styles.stepperButton, pressed && { backgroundColor: colors.surfacePressed }]}>
        <Icon name="remove" size={20} color={value <= min ? 'textTertiary' : 'text'} />
      </Pressable>
      <Text variant="heading" style={styles.stepperValue} accessibilityLabel={`${label ?? 'Cantidad'}: ${value}`}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sumar ${label ?? ''}`}
        onPress={() => step(1)}
        style={({ pressed }) => [styles.stepperButton, pressed && { backgroundColor: colors.surfacePressed }]}>
        <Icon name="add" size={20} />
      </Pressable>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.surface }]}>
            {o.icon && <Icon name={o.icon} size={16} color={active ? 'text' : 'textSecondary'} />}
            <Text variant="label" color={active ? 'text' : 'textSecondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="label" color="textSecondary">
        {value === null ? 'Sin dato' : value ? 'Sí' : 'No'}
      </Text>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ true: colors.success, false: colors.borderStrong }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs + 2 },
  label: { marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: space.md },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    paddingVertical: space.sm,
    // En la web el borde ya marca el foco; se saca el contorno del navegador.
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },
  multilineInput: { minHeight: 88, textAlignVertical: 'top' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  stepperButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { minWidth: 44, textAlign: 'center' },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.lg, gap: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: space.xs + 2,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
