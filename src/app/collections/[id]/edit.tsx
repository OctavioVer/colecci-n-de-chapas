import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/ui/button';
import { confirm, Tip } from '@/components/ui/feedback';
import { Icon, type IconName } from '@/components/ui/icon';
import { TextField } from '@/components/ui/inputs';
import { Screen, Sheet, TopBar } from '@/components/ui/layout';
import { Card, Chip, Divider } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { uniqueFieldId } from '@/domain/templates';
import type { FieldDef, FieldType } from '@/domain/types';
import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

const TYPES: { value: FieldType; label: string; icon: IconName; description: string }[] = [
  { value: 'text', label: 'Texto', icon: 'text-outline', description: 'Marca, país, leyenda…' },
  { value: 'select', label: 'Lista', icon: 'list-outline', description: 'Opciones fijas para elegir' },
  { value: 'number', label: 'Número', icon: 'calculator-outline', description: 'Año, capacidad, precio…' },
  { value: 'boolean', label: 'Sí / No', icon: 'toggle-outline', description: 'Abierta, funciona…' },
];

const SWATCHES = ['#D9412B', '#E8A33D', '#1E9E7A', '#2F6FDB', '#8A4FD8', '#D6457A', '#1F2430', '#7A5C3E'];

export default function EditCollection() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useStore((s) => s.collections.find((c) => c.id === id));
  const itemCount = useStore((s) => s.items.filter((i) => i.collectionId === id).length);
  const collectionsCount = useStore((s) => s.collections.length);
  const { updateCollection, setFields, deleteCollection } = useStore.getState();
  const [editing, setEditing] = useState<FieldDef | 'new' | null>(null);
  const [name, setName] = useState(collection?.name ?? '');

  if (!collection) return null;
  const fields = collection.fields;

  const move = (index: number, delta: number) => {
    const next = [...fields];
    const [f] = next.splice(index, 1);
    next.splice(index + delta, 0, f);
    setFields(collection.id, next);
  };

  const saveField = (field: FieldDef) => {
    const exists = fields.some((f) => f.id === field.id);
    setFields(collection.id, exists ? fields.map((f) => (f.id === field.id ? field : f)) : [...fields, field]);
    setEditing(null);
  };

  const removeField = async (field: FieldDef) => {
    const ok = await confirm({
      title: `¿Quitar “${field.label}”?`,
      message: 'El campo deja de aparecer en el formulario y en los filtros.',
      confirmLabel: 'Quitar',
      destructive: true,
    });
    if (ok) {
      setFields(collection.id, fields.filter((f) => f.id !== field.id));
      setEditing(null);
    }
  };

  const removeCollection = async () => {
    const ok = await confirm({
      title: `¿Eliminar “${collection.name}”?`,
      message: `Se borran también sus ${itemCount} piezas y fotos. No se puede deshacer.`,
      confirmLabel: 'Eliminar colección',
      destructive: true,
    });
    if (ok) {
      router.back();
      deleteCollection(collection.id);
    }
  };

  return (
    <Screen header={<TopBar title="Editar colección" />}>
      <View style={{ gap: space.xl, paddingTop: space.md }}>
        <Tip
          id="edit-fields"
          icon="construct-outline"
          title="Tu colección, tus datos"
          message="Agregá los campos que uses para clasificar. Cada campo aparece al cargar piezas, en los filtros y en el Excel."
        />
        <TextField
          label="Nombre de la colección"
          value={name}
          onChangeText={setName}
          onBlur={() => name.trim() && updateCollection(collection.id, { name: name.trim() })}
        />

        <View style={{ gap: space.sm }}>
          <Text variant="label" color="textSecondary">
            Color
          </Text>
          <View style={styles.swatches}>
            {SWATCHES.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityLabel={`Color ${c}`}
                accessibilityState={{ checked: c === collection.color }}
                onPress={() => updateCollection(collection.id, { color: c })}
                style={[styles.swatch, { backgroundColor: c, borderColor: c === collection.color ? colors.text : 'transparent' }]}>
                {c === collection.color && <Icon name="checkmark" size={18} tint="#FFFFFF" />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: space.md }}>
          <View style={styles.fieldsHeader}>
            <Text variant="heading">Campos</Text>
            <Text variant="label" color="textSecondary">
              {fields.length}
            </Text>
          </View>
          <Card padded={false}>
            <View style={styles.fixedRow}>
              <Icon name="lock-closed-outline" size={16} color="textTertiary" />
              <Text variant="label" color="textSecondary" style={{ flex: 1, fontFamily: 'PlusJakartaSans_500Medium' }}>
                Nombre, cantidad, fotos y notas vienen siempre.
              </Text>
            </View>
            {fields.map((f, i) => {
              const type = TYPES.find((t) => t.value === f.type)!;
              return (
                <View key={f.id}>
                  <Divider />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar campo ${f.label}`}
                    onPress={() => setEditing(f)}
                    style={({ pressed }) => [styles.fieldRow, pressed && { backgroundColor: colors.surfacePressed }]}>
                    <View style={[styles.typeIcon, { backgroundColor: colors.surfaceMuted }]}>
                      <Icon name={type.icon} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{f.label}</Text>
                      <Text variant="caption" color="textSecondary" numberOfLines={1}>
                        {f.type === 'select' ? `Lista · ${f.options?.length ?? 0} opciones` : type.label}
                      </Text>
                    </View>
                    <View style={{ opacity: i > 0 ? 1 : 0.3 }}>
                      <IconButton icon="chevron-up" label={`Subir ${f.label}`} variant="ghost" size={36} onPress={() => i > 0 && move(i, -1)} />
                    </View>
                    <View style={{ opacity: i < fields.length - 1 ? 1 : 0.3 }}>
                      <IconButton
                        icon="chevron-down"
                        label={`Bajar ${f.label}`}
                        variant="ghost"
                        size={36}
                        onPress={() => i < fields.length - 1 && move(i, 1)}
                      />
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </Card>
          <Button label="Agregar campo" icon="add" variant="secondary" onPress={() => setEditing('new')} />
        </View>

        <View style={{ gap: space.sm, marginTop: space.lg }}>
          <Button
            label="Eliminar colección"
            variant="danger"
            icon="trash-outline"
            onPress={removeCollection}
            disabled={collectionsCount <= 1}
          />
          {collectionsCount <= 1 && (
            <Text variant="caption" color="textTertiary" align="center">
              Tenés que tener al menos una colección.
            </Text>
          )}
        </View>
      </View>

      <FieldEditor
        key={editing === 'new' ? 'new' : editing?.id}
        field={editing}
        usedIds={fields.map((f) => f.id)}
        onClose={() => setEditing(null)}
        onSave={saveField}
        onRemove={removeField}
      />
    </Screen>
  );
}

function FieldEditor({
  field,
  usedIds,
  onClose,
  onSave,
  onRemove,
}: {
  field: FieldDef | 'new' | null;
  usedIds: string[];
  onClose: () => void;
  onSave: (f: FieldDef) => void;
  onRemove: (f: FieldDef) => void;
}) {
  const colors = useColors();
  const existing = field && field !== 'new' ? field : undefined;
  const [label, setLabel] = useState(existing?.label ?? '');
  const [type, setType] = useState<FieldType>(existing?.type ?? 'text');
  const [options, setOptions] = useState<string[]>(existing?.options ?? []);
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState<string>();

  const addOption = () => {
    const o = newOption.trim();
    if (o && !options.includes(o)) setOptions([...options, o]);
    setNewOption('');
  };

  const save = () => {
    if (!label.trim()) {
      setError('Poné un nombre para el campo');
      return;
    }
    const pending = newOption.trim();
    const finalOptions = pending && !options.includes(pending) ? [...options, pending] : options;
    onSave({
      id: existing?.id ?? uniqueFieldId(label, new Set(usedIds)),
      label: label.trim(),
      type,
      options: type === 'select' ? finalOptions : undefined,
      hint: existing?.hint,
    });
  };

  return (
    <Sheet
      visible={field !== null}
      onClose={onClose}
      title={existing ? 'Editar campo' : 'Nuevo campo'}
      footer={
        <>
          {existing && <Button label="Quitar" variant="danger" onPress={() => onRemove(existing)} style={{ flex: 1 }} />}
          <Button label={existing ? 'Guardar' : 'Agregar campo'} onPress={save} style={{ flex: 2 }} />
        </>
      }>
      <View style={{ gap: space.xl }}>
        <TextField
          label="Nombre del campo"
          placeholder="Ej: Serie, Cervecería, Tamaño…"
          value={label}
          onChangeText={(t) => {
            setLabel(t);
            setError(undefined);
          }}
          error={error}
          autoFocus={!existing}
        />
        <View style={{ gap: space.sm }}>
          <Text variant="label" color="textSecondary">
            Tipo de dato
          </Text>
          <View style={styles.types}>
            {TYPES.map((t) => {
              const selected = t.value === type;
              return (
                <Pressable
                  key={t.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${t.label}: ${t.description}`}
                  onPress={() => setType(t.value)}
                  style={[
                    styles.typeCard,
                    { backgroundColor: colors.surface, borderColor: selected ? colors.text : colors.border, borderWidth: selected ? 2 : 1 },
                  ]}>
                  <Icon name={t.icon} size={20} />
                  <Text variant="bodyStrong">{t.label}</Text>
                  <Text variant="caption" color="textSecondary">
                    {t.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {type === 'select' && (
          <View style={{ gap: space.md }}>
            <Text variant="label" color="textSecondary">
              Opciones
            </Text>
            {options.length > 0 && (
              <View style={styles.options}>
                {options.map((o) => (
                  <Chip key={o} label={o} onRemove={() => setOptions(options.filter((x) => x !== o))} />
                ))}
              </View>
            )}
            <View style={styles.addOption}>
              <View style={{ flex: 1 }}>
                <TextField
                  placeholder="Nueva opción"
                  value={newOption}
                  onChangeText={setNewOption}
                  onSubmitEditing={addOption}
                  submitBehavior="submit"
                  returnKeyType="done"
                />
              </View>
              <IconButton icon="add" label="Agregar opción" onPress={addOption} size={52} />
            </View>
          </View>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  fieldsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fixedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg, paddingRight: space.sm, paddingVertical: space.md },
  typeIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  typeCard: { flexBasis: '46%', flexGrow: 1, padding: space.lg, borderRadius: radius.lg, gap: space.xs },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  addOption: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
