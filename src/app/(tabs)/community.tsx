import { StyleSheet, View } from 'react-native';

import { CommunityScene } from '@/components/illustrations/scenes';
import { Icon, type IconName } from '@/components/ui/icon';
import { PageTitle, Screen } from '@/components/ui/layout';
import { Badge, Card } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'person-circle-outline',
    title: 'Perfil de coleccionista',
    body: 'Mostrá tu colección (o solo una parte) a otros coleccionistas.',
  },
  {
    icon: 'swap-horizontal-outline',
    title: 'Intercambios de repetidas',
    body: 'Publicá tus repetidas y encontrá quién tiene las que te faltan.',
  },
  {
    icon: 'pricetag-outline',
    title: 'Compra y venta',
    body: 'Publicaciones con precio, entre coleccionistas.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Reputación y ranking',
    body: 'Calificaciones después de cada intercambio para operar con confianza.',
  },
  {
    icon: 'library-outline',
    title: 'Catálogo compartido',
    body: 'Una biblioteca pública de piezas, armada entre todos.',
  },
];

export default function Community() {
  const colors = useColors();

  return (
    <Screen withTabBar>
      <PageTitle title="Comunidad" subtitle="Conectá con otros coleccionistas." />
      <Card padded={false}>
        <View style={[styles.hero, { backgroundColor: colors.surfaceMuted }]}>
          <CommunityScene width={260} />
        </View>
        <View style={styles.heroCopy}>
          <Badge label="Muy pronto" tone="primary" />
          <Text variant="title">Estamos armando la comunidad</Text>
          <Text variant="body" color="textSecondary">
            Primero ordenamos bien tu colección. Lo siguiente es poder intercambiar, comprar y vender con otros coleccionistas.
          </Text>
        </View>
      </Card>

      <Text variant="overline" color="textTertiary" style={styles.overline}>
        Lo que viene
      </Text>
      <View style={{ gap: space.md }}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
              <Icon name={f.icon} size={22} color="primary" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{f.title}</Text>
              <Text variant="label" color="textSecondary" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                {f.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text variant="caption" color="textTertiary" align="center" style={{ marginTop: space.xl }}>
        La comunidad llega en la etapa 2, junto con la sincronización online.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: space.lg },
  heroCopy: { padding: space.xl, gap: space.sm },
  overline: { marginTop: space.xxl, marginBottom: space.md },
  feature: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.xl, borderWidth: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
