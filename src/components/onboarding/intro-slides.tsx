import { useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExcelScene, FieldsScene, InventoryScene, SearchScene } from '@/components/illustrations/scenes';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  art: (width: number) => ReactNode;
}

export const SLIDES: Slide[] = [
  {
    eyebrow: 'Inventario',
    title: 'Tu colección, siempre en el bolsillo',
    body: 'Cargá cada pieza con fotos y datos. Sabé al instante cuántas tenés y cuáles están repetidas.',
    art: (w) => <InventoryScene width={w} />,
  },
  {
    eyebrow: 'A tu medida',
    title: 'Cada colección es distinta',
    body: 'Chapas, latas, biromes o lo que sea: elegí una plantilla y sumá los campos que a vos te importan.',
    art: (w) => <FieldsScene width={w} />,
  },
  {
    eyebrow: 'Búsquedas cruzadas',
    title: 'Encontrá cualquier pieza en segundos',
    body: 'Combiná filtros como país, marca y año, y ordená como quieras. Los conteos se arman solos.',
    art: (w) => <SearchScene width={w} />,
  },
  {
    eyebrow: 'Importar',
    title: '¿Ya la tenés en Excel?',
    body: 'Subí tu planilla y la app la acomoda. También podés bajar nuestra planilla modelo y completarla.',
    art: (w) => <ExcelScene width={w} />,
  },
];

export function IntroSlides({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const width = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const artWidth = Math.min(width - space.xl * 2, windowHeight * 0.42, 340);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { width }]}>
        <View style={styles.progress}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Ir a la pantalla ${i + 1} de ${SLIDES.length}`}
              onPress={() => goTo(i)}
              hitSlop={8}
              style={[
                styles.dot,
                { backgroundColor: i <= index ? colors.primary : colors.border, flex: i === index ? 2 : 1 },
              ]}
            />
          ))}
        </View>
        {!isLast && (
          <Pressable accessibilityRole="button" onPress={onDone} hitSlop={10}>
            <Text variant="label" color="textSecondary">
              Saltar
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ width, alignSelf: 'center', flexGrow: 1 }}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.art}>{slide.art(artWidth)}</View>
            {i === index ? (
              <Animated.View entering={FadeIn.duration(350)} style={styles.copy}>
                <SlideCopy slide={slide} />
              </Animated.View>
            ) : (
              <View style={styles.copy}>
                <SlideCopy slide={slide} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { width, paddingBottom: insets.bottom + space.lg }]}>
        <Button
          label={isLast ? doneLabel : 'Siguiente'}
          iconRight={isLast ? undefined : 'arrow-forward'}
          size="lg"
          fullWidth
          onPress={() => (isLast ? onDone() : goTo(index + 1))}
        />
      </View>
    </View>
  );
}

function SlideCopy({ slide }: { slide: Slide }) {
  const colors = useColors();
  return (
    <>
      <View style={[styles.eyebrow, { backgroundColor: colors.primarySoft }]}>
        <Text variant="overline" color="primary">
          {slide.eyebrow}
        </Text>
      </View>
      <Text variant="display" align="center">
        {slide.title}
      </Text>
      <Text variant="body" color="textSecondary" align="center" style={styles.body}>
        {slide.body}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    minHeight: 56,
  },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  dot: { height: 5, borderRadius: 3 },
  slide: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'center', gap: space.xxl },
  art: { alignItems: 'center' },
  copy: { alignItems: 'center', gap: space.md },
  eyebrow: { paddingHorizontal: space.md, paddingVertical: 5, borderRadius: radius.pill },
  body: { maxWidth: 360, fontSize: 16, lineHeight: 24 },
  footer: { paddingHorizontal: space.xl, paddingTop: space.lg },
});
