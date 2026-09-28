import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { CrownCap } from '@/components/illustrations/crown-cap';
import { placeholderColor } from '@/components/item-views';
import { Button, IconButton } from '@/components/ui/button';
import { confirm } from '@/components/ui/feedback';
import { Stepper } from '@/components/ui/inputs';
import { Screen, TopBar } from '@/components/ui/layout';
import { Badge, Card, Divider } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { displayValue } from '@/domain/search';
import { getTemplate } from '@/domain/templates';
import { useStore } from '@/store/store';
import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

export default function ItemDetail() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => s.items.find((i) => i.id === id));
  const collection = useStore((s) => s.collections.find((c) => c.id === item?.collectionId));
  const changeQuantity = useStore((s) => s.changeQuantity);
  const deleteItem = useStore((s) => s.deleteItem);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!item || !collection) {
    return (
      <Screen header={<TopBar />}>
        <Text variant="body" color="textSecondary" align="center" style={{ marginTop: space.huge }}>
          Esta pieza ya no existe.
        </Text>
      </Screen>
    );
  }

  const template = getTemplate(collection.templateId);
  const photoSize = Math.min(width, MAX_CONTENT_WIDTH) - space.xl * 2;
  const filled = collection.fields.filter((f) => displayValue(item.values[f.id]) !== '');
  const missing = collection.fields.length - filled.length;
  const edit = () => router.push({ pathname: '/item/form', params: { id: item.id } });

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / photoSize));

  const remove = async () => {
    const ok = await confirm({
      title: `¿Eliminar “${item.title}”?`,
      message: 'Se borra la pieza con sus fotos y datos. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) {
      router.back();
      deleteItem(item.id);
    }
  };

  return (
    <Screen header={<TopBar right={<IconButton icon="create-outline" label="Editar" onPress={edit} />} />}>
      <View style={[styles.photoWrap, { width: photoSize, height: photoSize, backgroundColor: colors.surfaceMuted }]}>
        {item.photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}>
            {item.photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: photoSize, height: photoSize }} contentFit="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noPhoto}>
            <CrownCap size={photoSize * 0.4} color={placeholderColor(item, collection)} />
            <Button label="Agregar foto" variant="secondary" size="sm" icon="camera-outline" onPress={edit} />
          </View>
        )}
        {item.photos.length > 1 && (
          <View style={styles.dots}>
            {item.photos.map((uri, i) => (
              <View key={uri} style={[styles.dot, { backgroundColor: '#FFFFFF', opacity: i === photoIndex ? 1 : 0.5 }]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.titleBlock}>
        <Badge label={collection.name} />
        <Text variant="title">{item.title}</Text>
      </View>

      <Card style={styles.quantity}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Ejemplares</Text>
          <Text variant="caption" color="textSecondary">
            {item.quantity > 1
              ? `${item.quantity - 1} ${item.quantity - 1 === 1 ? 'repetida' : 'repetidas'} para intercambiar`
              : 'Sin repetidas'}
          </Text>
        </View>
        <Stepper value={item.quantity} onChange={(v) => changeQuantity(item.id, v - item.quantity)} label="ejemplares" />
      </Card>

      <Card padded={false} style={{ marginTop: space.lg }}>
        {filled.length === 0 ? (
          <View style={{ padding: space.lg }}>
            <Text variant="body" color="textSecondary">
              Todavía no cargaste datos de esta {template.itemNoun}.
            </Text>
          </View>
        ) : (
          filled.map((f, i) => (
            <View key={f.id}>
              {i > 0 && <Divider inset={space.lg} />}
              <View style={styles.fieldRow}>
                <Text variant="label" color="textSecondary" style={styles.fieldLabel}>
                  {f.label}
                </Text>
                <Text variant="bodyStrong" style={styles.fieldValue}>
                  {displayValue(item.values[f.id])}
                </Text>
              </View>
            </View>
          ))
        )}
        {missing > 0 && (
          <>
            <Divider />
            <Button
              label={`Completar ${missing} ${missing === 1 ? 'dato' : 'datos'} más`}
              variant="ghost"
              size="sm"
              icon="add"
              onPress={edit}
              style={{ margin: space.sm, alignSelf: 'flex-start' }}
            />
          </>
        )}
      </Card>

      {item.notes !== '' && (
        <Card style={{ marginTop: space.lg, gap: space.xs }}>
          <Text variant="overline" color="textTertiary">
            Notas
          </Text>
          <Text variant="body">{item.notes}</Text>
        </Card>
      )}

      <Text variant="caption" color="textTertiary" align="center" style={{ marginTop: space.xl }}>
        Agregada el {new Date(item.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>

      <Button
        label={`Eliminar ${template.itemNoun}`}
        variant="danger"
        icon="trash-outline"
        onPress={remove}
        style={{ marginTop: space.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoWrap: { borderRadius: radius.xxl, overflow: 'hidden', alignSelf: 'center', marginTop: space.sm },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  dots: { position: 'absolute', bottom: space.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  titleBlock: { gap: space.sm, marginTop: space.xl, marginBottom: space.lg },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, padding: space.lg },
  fieldLabel: { width: 120, paddingTop: 2 },
  fieldValue: { flex: 1 },
});
