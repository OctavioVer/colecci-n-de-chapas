import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Collection } from '@/domain/types';
import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { Icon, type IconName } from './ui/icon';
import { Card, ProgressBar } from './ui/surfaces';
import { Text } from './ui/text';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  done: boolean;
  onPress?: () => void;
}

/**
 * Guía de primeros pasos: el onboarding sigue dentro de la app, llevando al
 * usuario a probar cada función la primera vez.
 */
export function GettingStarted({ collection }: { collection: Collection }) {
  const colors = useColors();
  const items = useStore((s) => s.items);
  const milestones = useStore((s) => s.milestones);
  const hidden = useStore((s) => s.checklistHidden);
  const hide = useStore((s) => s.hideChecklist);
  if (hidden) return null;

  const hasItem = items.some((i) => i.collectionId === collection.id);
  const hasPhoto = items.some((i) => i.photos.length > 0);
  const steps: Step[] = [
    { id: 'create', title: 'Creaste tu colección', description: collection.name, icon: 'albums-outline', done: true },
    {
      id: 'item',
      title: 'Cargá tu primera pieza',
      description: 'Con el botón + de abajo, en cualquier momento.',
      icon: 'add-circle-outline',
      done: hasItem,
      onPress: () => router.push('/item/form'),
    },
    {
      id: 'photo',
      title: 'Sumá una foto',
      description: 'Desde la cámara o la galería. Ayuda mucho a identificarlas.',
      icon: 'camera-outline',
      done: hasPhoto,
      onPress: () => router.push('/item/form'),
    },
    {
      id: 'filters',
      title: 'Probá los filtros',
      description: 'Combiná país, marca, año y más para encontrar cualquier pieza.',
      icon: 'options-outline',
      done: milestones.includes('usedFilters'),
      onPress: () => router.navigate('/collection'),
    },
    {
      id: 'fields',
      title: 'Personalizá los campos',
      description: 'Agregá los datos que a vos te importan.',
      icon: 'construct-outline',
      done: milestones.includes('editedFields'),
      onPress: () => router.push({ pathname: '/collections/[id]/edit', params: { id: collection.id } }),
    },
    {
      id: 'excel',
      title: 'Importá tu Excel',
      description: 'Si ya tenés tu colección en una planilla, subila entera.',
      icon: 'document-text-outline',
      done: milestones.includes('importedExcel'),
      onPress: () => router.push({ pathname: '/collections/[id]/import', params: { id: collection.id } }),
    },
  ];
  // El primer paso ya viene hecho; el contador muestra los 5 que faltan.
  const total = steps.length - 1;
  const doneCount = steps.filter((s) => s.done).length - 1;
  const allDone = doneCount === total;
  const next = steps.find((s) => !s.done);

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="overline" color="primary">
            Primeros pasos
          </Text>
          <Text variant="heading">{allDone ? '¡Ya sabés usar todo!' : 'Conocé la app en 5 pasos'}</Text>
        </View>
        <Text variant="label" color="textSecondary">
          {doneCount}/{total}
        </Text>
      </View>
      <View style={styles.progress}>
        <ProgressBar value={Math.max(0.04, doneCount / total)} />
      </View>
      {steps.map((step) => {
        const isNext = step.id === next?.id;
        return (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityState={{ checked: step.done }}
            accessibilityLabel={`${step.title}${step.done ? ', hecho' : ''}`}
            disabled={step.done || !step.onPress}
            onPress={step.onPress}
            style={({ pressed }) => [styles.step, pressed && { backgroundColor: colors.surfacePressed }]}>
            <View
              style={[
                styles.check,
                step.done
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : { borderColor: isNext ? colors.primary : colors.borderStrong },
              ]}>
              {step.done && <Icon name="checkmark" size={16} tint="#FFFFFF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="bodyStrong"
                color={step.done ? 'textTertiary' : 'text'}
                style={step.done && { textDecorationLine: 'line-through' }}>
                {step.title}
              </Text>
              {isNext && (
                <Text variant="caption" color="textSecondary">
                  {step.description}
                </Text>
              )}
            </View>
            {!step.done && <Icon name={step.icon} size={20} color={isNext ? 'primary' : 'textTertiary'} />}
          </Pressable>
        );
      })}
      {allDone && (
        <Pressable accessibilityRole="button" onPress={hide} style={[styles.hide, { borderTopColor: colors.border }]}>
          <Text variant="label" color="primary">
            Ocultar guía
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', padding: space.lg, paddingBottom: space.md },
  progress: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  check: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hide: { alignItems: 'center', paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});
