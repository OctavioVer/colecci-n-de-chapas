import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FieldInput } from '@/components/field-input';
import { ItemThumb } from '@/components/item-views';
import { PhotoStrip } from '@/components/photo-strip';
import { Button, haptic } from '@/components/ui/button';
import { Tip } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Stepper, TextField } from '@/components/ui/inputs';
import { Screen, TopBar } from '@/components/ui/layout';
import { Card, Chip } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { facetValues, normalize } from '@/domain/search';
import { getTemplate } from '@/domain/templates';
import type { FieldValue, Item } from '@/domain/types';
import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

interface Draft {
  title: string;
  quantity: number;
  values: Record<string, FieldValue>;
  notes: string;
  photos: string[];
}

const emptyDraft = (): Draft => ({ title: '', quantity: 1, values: {}, notes: '', photos: [] });

export default function ItemForm() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id?: string; collectionId?: string }>();
  const collections = useStore((s) => s.collections);
  const allItems = useStore((s) => s.items);
  const activeId = useStore((s) => s.activeCollectionId);
  const { addItem, updateItem, changeQuantity } = useStore.getState();

  const editing = params.id ? allItems.find((i) => i.id === params.id) : undefined;
  const [collectionId, setCollectionId] = useState(
    editing?.collectionId ?? params.collectionId ?? activeId ?? collections[0]?.id,
  );
  const collection = collections.find((c) => c.id === collectionId);
  const [draft, setDraft] = useState<Draft>(() =>
    editing
      ? { title: editing.title, quantity: editing.quantity, values: { ...editing.values }, notes: editing.notes, photos: [...editing.photos] }
      : emptyDraft(),
  );
  const [savedCount, setSavedCount] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const collectionItems = useMemo(() => allItems.filter((i) => i.collectionId === collectionId), [allItems, collectionId]);

  const suggestions = useMemo(() => {
    const result: Record<string, string[]> = {};
    collection?.fields.forEach((f) => {
      if (f.type === 'text') result[f.id] = facetValues(collectionItems, f).map((x) => x.value);
    });
    return result;
  }, [collection, collectionItems]);

  // Si ya existe una pieza con el mismo nombre, probablemente sea una repetida.
  const duplicate = useMemo(() => {
    const t = normalize(draft.title);
    if (t.length < 3) return undefined;
    return collectionItems.find((i) => i.id !== editing?.id && normalize(i.title) === t);
  }, [draft.title, collectionItems, editing?.id]);

  if (!collection) return null;
  const template = getTemplate(collection.templateId);
  const titleError = showErrors && !draft.title.trim() ? 'Poné un nombre para identificarla' : undefined;

  const save = (another: boolean) => {
    if (!draft.title.trim()) {
      setShowErrors(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const data = { ...draft, title: draft.title.trim(), notes: draft.notes.trim(), collectionId: collection.id };
    haptic('success');
    if (editing) {
      updateItem(editing.id, data);
      router.back();
      return;
    }
    const item = addItem(data);
    if (another) {
      setDraft(emptyDraft());
      setFormKey((k) => k + 1);
      setSavedCount((n) => n + 1);
      setShowErrors(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.replace({ pathname: '/item/[id]', params: { id: item.id } });
    }
  };

  const addAsDuplicate = (existing: Item) => {
    changeQuantity(existing.id, draft.quantity);
    haptic('success');
    router.replace({ pathname: '/item/[id]', params: { id: existing.id } });
  };

  return (
    <Screen
      ref={scrollRef}
      header={
        <TopBar
          backIcon="close"
          title={editing ? `Editar ${template.itemNoun}` : `Nueva ${template.itemNoun}`}
          subtitle={collection.name}
        />
      }
      footer={
        editing ? (
          <Button label="Guardar cambios" size="lg" style={{ flex: 1 }} onPress={() => save(false)} />
        ) : (
          <>
            <Button label="Guardar y otra" variant="secondary" size="lg" style={{ flex: 1 }} onPress={() => save(true)} />
            <Button label="Guardar" size="lg" style={{ flex: 1 }} onPress={() => save(false)} />
          </>
        )
      }>
      <View key={formKey} style={styles.form}>
        {savedCount > 0 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.saved, { backgroundColor: colors.successSoft }]}>
            <Icon name="checkmark-circle" size={20} color="success" />
            <Text variant="label" style={{ color: colors.success, flex: 1 }}>
              {savedCount === 1 ? '¡Guardada! Cargá la siguiente.' : `¡Van ${savedCount} guardadas! Seguí con la próxima.`}
            </Text>
          </Animated.View>
        )}

        {!editing && (
          <Tip
            id="item-form"
            icon="flash-outline"
            title="Carga rápida"
            message="Solo el nombre es obligatorio. Usá “Guardar y otra” para cargar varias seguidas."
          />
        )}

        {!editing && collections.length > 1 && (
          <View style={styles.collectionPicker}>
            {collections.map((c) => (
              <Chip key={c.id} label={c.name} tint={c.color} selected={c.id === collectionId} onPress={() => setCollectionId(c.id)} />
            ))}
          </View>
        )}

        <PhotoStrip photos={draft.photos} onChange={(photos) => setDraft({ ...draft, photos })} />

        <TextField
          label="Nombre"
          placeholder={template.titleHint}
          value={draft.title}
          onChangeText={(title) => setDraft({ ...draft, title })}
          error={titleError}
          autoCapitalize="sentences"
        />

        {duplicate && (
          <Card style={[styles.duplicate, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
            <View style={styles.duplicateThumb}>
              <ItemThumb item={duplicate} collection={collection} size={52} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">Ya tenés “{duplicate.title}”</Text>
              <Text variant="caption" color="textSecondary">
                {duplicate.quantity === 1 ? '1 ejemplar' : `${duplicate.quantity} ejemplares`}. ¿Es una repetida?
              </Text>
            </View>
            <Button label={`Sumar ${draft.quantity}`} size="sm" variant="ink" icon="add" onPress={() => addAsDuplicate(duplicate)} />
          </Card>
        )}

        <View style={styles.quantity}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Ejemplares</Text>
            <Text variant="caption" color="textSecondary">
              {draft.quantity > 1
                ? `${draft.quantity - 1} ${draft.quantity - 1 === 1 ? 'repetida' : 'repetidas'} para intercambiar`
                : 'Cuántas tenés de esta'}
            </Text>
          </View>
          <Stepper value={draft.quantity} onChange={(quantity) => setDraft({ ...draft, quantity })} label="ejemplares" />
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="overline" color="textTertiary">
            Datos
          </Text>
          <Button
            label="Editar campos"
            variant="ghost"
            size="sm"
            icon="construct-outline"
            onPress={() => router.push({ pathname: '/collections/[id]/edit', params: { id: collection.id } })}
          />
        </View>

        {collection.fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={draft.values[field.id]}
            suggestions={suggestions[field.id]}
            onChange={(value) => setDraft((d) => ({ ...d, values: { ...d.values, [field.id]: value } }))}
          />
        ))}

        <TextField
          label="Notas"
          placeholder="Dónde la conseguiste, de quién fue, detalles…"
          value={draft.notes}
          onChangeText={(notes) => setDraft({ ...draft, notes })}
          multiline
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl, paddingTop: space.md },
  saved: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.lg },
  collectionPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  duplicate: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, marginTop: -space.sm },
  duplicateThumb: { width: 52, height: 52, borderRadius: radius.md, overflow: 'hidden' },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -space.sm },
});
