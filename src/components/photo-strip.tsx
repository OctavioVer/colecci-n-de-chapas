import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { pickPhoto, type PhotoSource } from '@/lib/photos';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { notify } from './ui/feedback';
import { Icon } from './ui/icon';
import { Sheet } from './ui/layout';
import { ListRow } from './ui/surfaces';
import { Text } from './ui/text';

const MAX_PHOTOS = 6;
const SIZE = 96;

export function PhotoStrip({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const colors = useColors();
  const [choosing, setChoosing] = useState(false);

  const add = async (source: PhotoSource) => {
    setChoosing(false);
    const result = await pickPhoto(source);
    if (!result) return;
    if ('error' in result) {
      notify('Sin permiso para la cámara', 'Habilitá el acceso a la cámara en la configuración del teléfono.');
      return;
    }
    onChange([...photos, result.uri]);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
        {photos.length < MAX_PHOTOS && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar foto"
            onPress={() => (Platform.OS === 'web' ? add('library') : setChoosing(true))}
            style={({ pressed }) => [
              styles.add,
              { borderColor: colors.borderStrong, backgroundColor: pressed ? colors.surfacePressed : colors.surface },
            ]}>
            <Icon name="camera-outline" size={26} color="textSecondary" />
            <Text variant="caption" color="textSecondary">
              {photos.length === 0 ? 'Agregar foto' : 'Otra foto'}
            </Text>
          </Pressable>
        )}
        {photos.map((uri, i) => (
          <View key={uri} style={styles.photo}>
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
            {i === 0 && (
              <View style={[styles.cover, { backgroundColor: colors.ink }]}>
                <Text variant="caption" style={{ color: colors.onInk, fontSize: 10 }}>
                  Portada
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar foto ${i + 1}`}
              onPress={() => onChange(photos.filter((p) => p !== uri))}
              hitSlop={6}
              style={[styles.remove, { backgroundColor: colors.ink }]}>
              <Icon name="close" size={14} tint={colors.onInk} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <Sheet visible={choosing} onClose={() => setChoosing(false)} title="Agregar foto">
        <View style={{ marginHorizontal: -space.xl }}>
          <ListRow icon="camera-outline" title="Sacar una foto" subtitle="Centrá la pieza y recortala cuadrada" onPress={() => add('camera')} />
          <ListRow icon="images-outline" title="Elegir de la galería" onPress={() => add('library')} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -space.xl, flexGrow: 0 },
  row: { gap: space.md, paddingHorizontal: space.xl },
  add: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  photo: { width: SIZE, height: SIZE, borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  cover: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
