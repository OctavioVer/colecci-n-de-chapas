import { router } from 'expo-router';
import type { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

import { IconButton } from './button';
import { Text } from './text';

export interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  /** Barra superior fija (por ejemplo `<TopBar/>`). */
  header?: ReactNode;
  /** Contenido fijo abajo (botón principal de un formulario). */
  footer?: ReactNode;
  scroll?: boolean;
  /** Deja lugar para la barra de pestañas. */
  withTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  ref?: Ref<ScrollView>;
}

export const TAB_BAR_SPACE = 96;

export function Screen({ children, header, footer, scroll = true, withTabBar, contentStyle, ref, ...props }: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottom = (withTabBar ? TAB_BAR_SPACE : 0) + (footer ? space.lg : insets.bottom + space.xxl);
  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top }}>{header}</View>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            ref={ref}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
            {...props}>
            {inner}
          </ScrollView>
        ) : (
          <View style={[styles.root, { paddingBottom: withTabBar ? TAB_BAR_SPACE : 0 }]}>{inner}</View>
        )}
        {footer && (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + space.md, backgroundColor: colors.background, borderTopColor: colors.border },
            ]}>
            <View style={styles.footerInner}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

export function TopBar({
  title,
  subtitle,
  right,
  onBack,
  backIcon = 'chevron-back',
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  backIcon?: 'chevron-back' | 'close';
}) {
  return (
    <View style={styles.topBar}>
      <IconButton
        icon={backIcon}
        label={backIcon === 'close' ? 'Cerrar' : 'Volver'}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <View style={styles.topBarTitle}>
        {title && (
          <Text variant="subheading" numberOfLines={1} align="center">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="caption" color="textSecondary" numberOfLines={1} align="center">
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.topBarRight}>{right}</View>
    </View>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.pageTitle}>
      <View style={{ flex: 1 }}>
        <Text variant="title">{title}</Text>
        {subtitle && (
          <Text variant="body" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + space.md }]}>
          <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.sheetHeader}>
            <Text variant="heading" style={{ flex: 1 }}>
              {title}
            </Text>
            <IconButton icon="close" label="Cerrar" onPress={onClose} size={36} />
          </View>
          <ScrollView style={styles.sheetBody} contentContainerStyle={{ paddingBottom: space.lg }}>
            {children}
          </ScrollView>
          {footer && <View style={styles.sheetFooter}>{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: space.xl,
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, paddingHorizontal: space.xl },
  footerInner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', flexDirection: 'row', gap: space.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH + space.xl * 2,
    alignSelf: 'center',
  },
  topBarTitle: { flex: 1 },
  topBarRight: { minWidth: 44, flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  pageTitle: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.lg, paddingBottom: space.xl },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH + space.xl * 2,
    alignSelf: 'center',
  },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: space.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xl, paddingVertical: space.md },
  sheetBody: { paddingHorizontal: space.xl },
  sheetFooter: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingTop: space.md },
});
