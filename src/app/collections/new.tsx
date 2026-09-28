import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { TemplatePicker } from '@/components/template-picker';
import { Button, haptic } from '@/components/ui/button';
import { TextField } from '@/components/ui/inputs';
import { Screen, TopBar } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { getTemplate, newCollection } from '@/domain/templates';
import { useStore } from '@/store/store';
import { space } from '@/theme/tokens';

export default function NewCollection() {
  const [templateId, setTemplateId] = useState('chapas');
  const [name, setName] = useState('');
  const addCollection = useStore((s) => s.addCollection);
  const template = getTemplate(templateId);

  return (
    <Screen
      header={<TopBar backIcon="close" title="Nueva colección" />}
      footer={
        <Button
          label="Crear colección"
          size="lg"
          style={{ flex: 1 }}
          onPress={() => {
            addCollection(newCollection(templateId, name));
            haptic('success');
            router.back();
            router.navigate('/collection');
          }}
        />
      }>
      <View style={{ gap: space.lg, paddingTop: space.md }}>
        <Text variant="body" color="textSecondary">
          Cada colección tiene sus propios campos. Elegí una plantilla y ajustala después.
        </Text>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        <TextField
          label="Nombre"
          placeholder={`Mis ${template.itemNounPlural}`}
          value={name}
          onChangeText={setName}
        />
      </View>
    </Screen>
  );
}
