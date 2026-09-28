import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Svg from 'react-native-svg';

import { CapShape } from '@/components/illustrations/crown-cap';
import { IntroSlides } from '@/components/onboarding/intro-slides';
import { TemplatePicker } from '@/components/template-picker';
import { Button, haptic } from '@/components/ui/button';
import { TextField } from '@/components/ui/inputs';
import { Screen, TopBar } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { getTemplate, newCollection } from '@/domain/templates';
import { useStore } from '@/store/store';
import { space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

type Step = 'intro' | 'name' | 'collection' | 'ready';

export default function Onboarding() {
  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('chapas');
  const [collectionName, setCollectionName] = useState('');
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const template = getTemplate(templateId);

  if (step === 'intro') return <IntroSlides doneLabel="Empezar" onDone={() => setStep('name')} />;

  if (step === 'name') {
    return (
      <Screen
        header={<TopBar onBack={() => setStep('intro')} right={<StepLabel current={1} />} />}
        footer={<Button label="Continuar" size="lg" style={{ flex: 1 }} onPress={() => setStep('collection')} />}>
        <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
          <Text variant="display">¿Cómo te llamás?</Text>
          <Text variant="body" color="textSecondary">
            Es para saludarte. Más adelante, cuando se sume la comunidad, va a ser tu nombre de coleccionista.
          </Text>
          <TextField
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => setStep('collection')}
            icon="person-outline"
          />
        </Animated.View>
      </Screen>
    );
  }

  if (step === 'collection') {
    return (
      <Screen
        header={<TopBar onBack={() => setStep('name')} right={<StepLabel current={2} />} />}
        footer={<Button label="Crear mi colección" size="lg" style={{ flex: 1 }} onPress={() => setStep('ready')} />}>
        <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
          <Text variant="display">¿Qué coleccionás?</Text>
          <Text variant="body" color="textSecondary">
            Elegí una plantilla para arrancar. Después podés agregar, quitar o renombrar campos cuando quieras.
          </Text>
          <TemplatePicker value={templateId} onChange={setTemplateId} />
          <TextField
            label="Nombre de la colección"
            placeholder={`Mis ${template.itemNounPlural}`}
            value={collectionName}
            onChangeText={setCollectionName}
          />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label="Ir a mi colección"
          size="lg"
          style={{ flex: 1 }}
          onPress={() => {
            haptic('success');
            completeOnboarding(name, newCollection(templateId, collectionName));
          }}
        />
      }>
      <ReadyStep name={name} noun={template.itemNounPlural} color={template.color} />
    </Screen>
  );
}

function StepLabel({ current }: { current: number }) {
  return (
    <Text variant="label" color="textSecondary">
      Paso {current} de 2
    </Text>
  );
}

function ReadyStep({ name, noun, color }: { name: string; noun: string; color: string }) {
  const colors = useColors();
  const tips = [
    { icon: '1', text: `Tocá el botón + para cargar tus primeras ${noun}.` },
    { icon: '2', text: 'En Inicio vas a ver una guía de primeros pasos.' },
    { icon: '3', text: 'Si ya tenés un Excel, importalo desde el menú de tu colección.' },
  ];
  return (
    <Animated.View entering={FadeInRight.duration(300)} style={[styles.stepBody, { paddingTop: space.huge }]}>
      <View style={styles.readyArt}>
        <Svg width={220} height={130} viewBox="0 0 220 130">
          <CapShape x={10} y={30} size={70} color="#2F6FDB" mark="band" />
          <CapShape x={70} y={5} size={90} color={color} mark="star" />
          <CapShape x={145} y={35} size={66} color="#E8A33D" mark="dot" markColor="#1F2430" />
        </Svg>
      </View>
      <Text variant="display" align="center">
        {name.trim() ? `¡Listo, ${name.trim().split(' ')[0]}!` : '¡Listo!'}
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        Tu colección ya está creada. Así seguís:
      </Text>
      <View style={styles.tips}>
        {tips.map((t) => (
          <View key={t.icon} style={[styles.tipRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.tipNumber, { backgroundColor: colors.ink }]}>
              <Text variant="label" style={{ color: colors.onInk }}>
                {t.icon}
              </Text>
            </View>
            <Text variant="body" style={{ flex: 1 }}>
              {t.text}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stepBody: { gap: space.lg, paddingTop: space.lg },
  readyArt: { alignItems: 'center', marginBottom: space.md },
  tips: { gap: space.sm, marginTop: space.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: 18, borderWidth: 1 },
  tipNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
