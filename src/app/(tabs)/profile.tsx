import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LogoMark } from '@/components/illustrations/crown-cap';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Segmented, TextField } from '@/components/ui/inputs';
import { PageTitle, Screen } from '@/components/ui/layout';
import { Card, Divider, ListRow } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { computeStats, formatCount } from '@/domain/stats';
import { getTemplate } from '@/domain/templates';
import { useStore, type ThemePreference } from '@/store/store';
import { space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

export default function Profile() {
  const colors = useColors();
  const profileName = useStore((s) => s.profileName);
  const setProfileName = useStore((s) => s.setProfileName);
  const collections = useStore((s) => s.collections);
  const items = useStore((s) => s.items);
  const themePreference = useStore((s) => s.themePreference);
  const setThemePreference = useStore((s) => s.setThemePreference);
  const setActive = useStore((s) => s.setActiveCollection);
  const resetAll = useStore((s) => s.resetAll);
  const showTipsAgain = useStore((s) => s.showTipsAgain);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profileName);
  const total = computeStats(items).total;

  return (
    <Screen withTabBar>
      <PageTitle title="Perfil" />

      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.ink }]}>
          <Text variant="title" style={{ color: colors.onInk }}>
            {(profileName[0] ?? 'V').toUpperCase()}
          </Text>
        </View>
        {editing ? (
          <View style={{ flex: 1, gap: space.sm }}>
            <TextField value={draftName} onChangeText={setDraftName} autoFocus placeholder="Tu nombre" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Cancelar" variant="secondary" size="sm" onPress={() => setEditing(false)} />
              <Button
                label="Guardar"
                size="sm"
                onPress={() => {
                  setProfileName(draftName);
                  setEditing(false);
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text variant="heading">{profileName || 'Coleccionista'}</Text>
            <Text variant="label" color="textSecondary" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              {formatCount(total)} piezas · {collections.length} {collections.length === 1 ? 'colección' : 'colecciones'}
            </Text>
          </View>
        )}
        {!editing && (
          <Button
            label="Editar"
            variant="secondary"
            size="sm"
            onPress={() => {
              setDraftName(profileName);
              setEditing(true);
            }}
          />
        )}
      </Card>

      <Section title="Mis colecciones">
        <Card padded={false}>
          {collections.map((c, i) => {
            const count = computeStats(items.filter((it) => it.collectionId === c.id)).total;
            return (
              <View key={c.id}>
                {i > 0 && <Divider inset={64} />}
                <ListRow
                  icon={getTemplate(c.templateId).icon as never}
                  iconTint={c.color}
                  title={c.name}
                  subtitle={`${formatCount(count)} ${getTemplate(c.templateId).itemNounPlural}`}
                  onPress={() => {
                    setActive(c.id);
                    router.navigate('/collection');
                  }}
                />
              </View>
            );
          })}
          <Divider />
          <ListRow icon="add" title="Nueva colección" onPress={() => router.push('/collections/new')} />
        </Card>
      </Section>

      <Section title="Apariencia">
        <Segmented<ThemePreference>
          value={themePreference}
          onChange={setThemePreference}
          options={[
            { value: 'system', label: 'Automático', icon: 'phone-portrait-outline' },
            { value: 'light', label: 'Claro', icon: 'sunny-outline' },
            { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
          ]}
        />
      </Section>

      <Section title="Ayuda">
        <Card padded={false}>
          <ListRow
            icon="play-circle-outline"
            title="Ver la presentación de nuevo"
            subtitle="El recorrido por las funciones principales"
            onPress={() => router.push('/tutorial')}
          />
          <Divider inset={64} />
          <ListRow
            icon="bulb-outline"
            title="Volver a mostrar los consejos"
            subtitle="La guía de primeros pasos y los tips de cada pantalla"
            onPress={showTipsAgain}
          />
        </Card>
      </Section>

      <Section title="Datos">
        <View style={[styles.notice, { backgroundColor: colors.surfaceMuted }]}>
          <Icon name="phone-portrait-outline" size={18} color="textSecondary" />
          <Text variant="label" color="textSecondary" style={{ flex: 1, fontFamily: 'PlusJakartaSans_500Medium' }}>
            Por ahora tu colección se guarda en este dispositivo. Exportala a Excel para tener una copia. Pronto se va a sincronizar online.
          </Text>
        </View>
        <Card padded={false}>
          <ListRow
            icon="trash-outline"
            title="Borrar todos los datos"
            destructive
            onPress={async () => {
              const ok = await confirm({
                title: '¿Borrar todo?',
                message: 'Se eliminan todas tus colecciones, piezas y fotos de este dispositivo. No se puede deshacer.',
                confirmLabel: 'Borrar todo',
                destructive: true,
              });
              if (ok) resetAll();
            }}
          />
        </Card>
      </Section>

      <View style={styles.footer}>
        <LogoMark size={32} color={colors.primary} />
        <Text variant="caption" color="textTertiary">
          Vitrina · versión 0.1 · Etapa 1: inventario
        </Text>
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" color="textTertiary" style={{ marginBottom: space.md }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: space.xxl },
  notice: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: 16, marginBottom: space.md },
  footer: { alignItems: 'center', gap: space.sm, marginTop: space.huge },
});
