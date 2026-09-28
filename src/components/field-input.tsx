import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { normalize } from '@/domain/search';
import type { FieldDef, FieldValue } from '@/domain/types';
import { parseNumber } from '@/lib/excel/mapping';
import { space } from '@/theme/tokens';

import { SwitchRow, TextField } from './ui/inputs';
import { Chip } from './ui/surfaces';
import { Text } from './ui/text';

/**
 * Campo del formulario de una pieza. Se arma según el tipo definido en la
 * colección, así cada colección tiene su propio formulario.
 */
export function FieldInput({
  field,
  value,
  onChange,
  suggestions = [],
}: {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  /** Valores ya usados en otras piezas, para cargar rápido y sin errores de tipeo. */
  suggestions?: string[];
}) {
  if (field.type === 'boolean') {
    return <SwitchRow label={field.label} value={typeof value === 'boolean' ? value : null} onChange={onChange} />;
  }
  if (field.type === 'select') return <SelectInput field={field} value={value} onChange={onChange} />;
  if (field.type === 'number') return <NumberInput field={field} value={value} onChange={onChange} />;
  return <TextInputWithSuggestions field={field} value={value} onChange={onChange} suggestions={suggestions} />;
}

function SelectInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
}) {
  const options = field.options ?? [];
  const current = typeof value === 'string' ? value : '';
  const isCustom = current !== '' && !options.some((o) => normalize(o) === normalize(current));
  const [showOther, setShowOther] = useState(isCustom);

  return (
    <View style={styles.block}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {field.label}
      </Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <Chip
            key={o}
            label={o}
            selected={normalize(o) === normalize(current)}
            onPress={() => {
              setShowOther(false);
              onChange(normalize(o) === normalize(current) ? null : o);
            }}
          />
        ))}
        <Chip
          label="Otro…"
          icon="create-outline"
          selected={showOther}
          onPress={() => {
            setShowOther(!showOther);
            if (showOther && isCustom) onChange(null);
          }}
        />
      </View>
      {showOther && (
        <TextField
          placeholder={`Escribí ${field.label.toLowerCase()}`}
          value={isCustom ? current : ''}
          onChangeText={(t) => onChange(t.trim() ? t : null)}
          autoFocus
        />
      )}
      {field.hint && (
        <Text variant="caption" color="textTertiary">
          {field.hint}
        </Text>
      )}
    </View>
  );
}

function NumberInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
}) {
  const [text, setText] = useState(value === null || value === undefined ? '' : String(value));
  const invalid = text.trim() !== '' && parseNumber(text) === null;
  return (
    <TextField
      label={field.label}
      hint={field.hint}
      error={invalid ? 'Tiene que ser un número' : undefined}
      value={text}
      keyboardType="numeric"
      inputMode="decimal"
      placeholder="—"
      onChangeText={(t) => {
        setText(t);
        onChange(t.trim() === '' ? null : (parseNumber(t) ?? t));
      }}
    />
  );
}

function TextInputWithSuggestions({
  field,
  value,
  onChange,
  suggestions,
}: {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  suggestions: string[];
}) {
  const [focused, setFocused] = useState(false);
  const text = value === null || value === undefined ? '' : String(value);
  const query = normalize(text);
  const matches = suggestions
    .filter((s) => normalize(s) !== query && (query === '' || normalize(s).includes(query)))
    .slice(0, 8);

  return (
    <View style={styles.block}>
      <TextField
        label={field.label}
        hint={field.hint}
        value={text}
        placeholder="—"
        onChangeText={(t) => onChange(t === '' ? null : t)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {focused && matches.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.suggestions}>
          {matches.map((s) => (
            <Chip key={s} label={s} icon="time-outline" onPress={() => onChange(s)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  label: { marginLeft: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  suggestions: { gap: space.sm },
});
