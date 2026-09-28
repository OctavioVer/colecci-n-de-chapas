import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, ZoomIn } from 'react-native-reanimated';

import { ExcelScene } from '@/components/illustrations/scenes';
import { Button, haptic } from '@/components/ui/button';
import { notify } from '@/components/ui/feedback';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen, Sheet, TopBar } from '@/components/ui/layout';
import { Badge, Card, Divider, ListRow } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { displayValue } from '@/domain/search';
import { formatCount } from '@/domain/stats';
import { getTemplate } from '@/domain/templates';
import type { Collection, FieldType } from '@/domain/types';
import { autoMap, buildImport, type ColumnTarget } from '@/lib/excel/mapping';
import { readSpreadsheet, type Table } from '@/lib/excel/read';
import { buildTemplateWorkbook, fileSafeName } from '@/lib/excel/workbooks';
import { pickSpreadsheet, shareFile } from '@/lib/files';
import { useStore } from '@/store/store';
import { radius, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

type Step = { kind: 'start' } | { kind: 'map'; fileName: string; table: Table } | { kind: 'done'; count: number; newFields: string[] };

const TYPE_LABEL: Record<FieldType, string> = { text: 'texto', number: 'número', select: 'lista', boolean: 'sí/no' };

function targetLabel(target: ColumnTarget, collection: Collection): string {
  switch (target.kind) {
    case 'title':
      return 'Nombre';
    case 'quantity':
      return 'Cantidad';
    case 'notes':
      return 'Notas';
    case 'field':
      return collection.fields.find((f) => f.id === target.fieldId)?.label ?? 'Campo';
    case 'new':
      return `Campo nuevo (${TYPE_LABEL[target.type]})`;
    default:
      return 'No importar';
  }
}

export default function ImportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useStore((s) => s.collections.find((c) => c.id === id));
  const importItems = useStore((s) => s.importItems);
  const [step, setStep] = useState<Step>({ kind: 'start' });
  const [loading, setLoading] = useState(false);

  if (!collection) return null;
  const template = getTemplate(collection.templateId);

  const pick = async () => {
    setLoading(true);
    try {
      const picked = await pickSpreadsheet();
      if (!picked) return;
      const table = await readSpreadsheet(picked.source);
      if (table.headers.length === 0 || table.rows.length === 0) {
        notify('La planilla está vacía', 'No encontramos filas con datos. Revisá que la primera hoja tenga encabezados y al menos una fila.');
        return;
      }
      setStep({ kind: 'map', fileName: picked.name, table });
    } catch {
      notify('No pudimos leer el archivo', 'Probá guardándolo como .xlsx o .csv desde Excel y volvé a subirlo.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await shareFile(buildTemplateWorkbook(collection), `${fileSafeName(collection.name)}-planilla-modelo.xlsx`);
    } catch (e) {
      notify('No se pudo generar la planilla', e instanceof Error ? e.message : 'Probá de nuevo.');
    }
  };

  if (step.kind === 'map') {
    return (
      <MappingStep
        collection={collection}
        fileName={step.fileName}
        table={step.table}
        onBack={() => setStep({ kind: 'start' })}
        onImport={(mapping) => {
          const result = buildImport(step.table, mapping, collection);
          importItems(collection.id, result.fields, result.items);
          haptic('success');
          setStep({ kind: 'done', count: result.items.length, newFields: result.newFieldLabels });
        }}
      />
    );
  }

  if (step.kind === 'done') {
    return (
      <Screen
        header={<TopBar backIcon="close" />}
        footer={
          <>
            <Button label="Importar otro" variant="secondary" size="lg" style={{ flex: 1 }} onPress={() => setStep({ kind: 'start' })} />
            <Button
              label="Ver colección"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => {
                router.back();
                router.navigate('/collection');
              }}
            />
          </>
        }>
        <View style={styles.done}>
          <Animated.View entering={ZoomIn.springify()}>
            <DoneBadge />
          </Animated.View>
          <Text variant="display" align="center">
            ¡Importación lista!
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            Se agregaron {formatCount(step.count)} {step.count === 1 ? template.itemNoun : template.itemNounPlural} a {collection.name}.
          </Text>
          {step.newFields.length > 0 && (
            <Card style={{ alignSelf: 'stretch', gap: space.sm }}>
              <Text variant="bodyStrong">Campos nuevos en tu colección</Text>
              <Text variant="label" color="textSecondary" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                {step.newFields.join(' · ')}
              </Text>
            </Card>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<TopBar title="Importar desde Excel" subtitle={collection.name} />}>
      <View style={styles.intro}>
        <ExcelScene width={240} />
        <Text variant="title" align="center">
          Traé tu colección de una
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Subí el Excel que ya tenés, aunque tenga otras columnas: te ayudamos a acomodar cada una.
        </Text>
      </View>

      <OptionCard
        icon="cloud-upload-outline"
        title="Subir mi Excel o CSV"
        body="Elegí el archivo desde el teléfono, Drive o el mail."
        primary
        loading={loading}
        onPress={pick}
      />

      <Text variant="overline" color="textTertiary" style={styles.overline}>
        ¿Empezás de cero?
      </Text>
      <OptionCard
        icon="download-outline"
        title="Usar la planilla modelo"
        body="Ya viene con las columnas de tu colección y listas desplegables."
        onPress={downloadTemplate}
      />
      <Card style={{ marginTop: space.md, gap: space.md }}>
        {[
          'Bajá la planilla modelo y abrila en Excel o Google Sheets.',
          `Completá una fila por ${template.itemNoun}.`,
          'Volvé acá y subila con “Subir mi Excel o CSV”.',
        ].map((text, i) => (
          <View key={text} style={styles.stepRow}>
            <Badge label={String(i + 1)} tone="primary" />
            <Text variant="body" style={{ flex: 1 }}>
              {text}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function OptionCard({
  icon,
  title,
  body,
  onPress,
  primary,
  loading,
}: {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
  primary?: boolean;
  loading?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: primary ? (pressed ? colors.primaryPressed : colors.primary) : pressed ? colors.surfacePressed : colors.surface,
          borderColor: primary ? colors.primary : colors.border,
          opacity: loading ? 0.7 : 1,
        },
      ]}>
      <View style={[styles.optionIcon, { backgroundColor: primary ? 'rgba(255,255,255,0.18)' : colors.surfaceMuted }]}>
        <Icon name={icon} size={24} tint={primary ? colors.onPrimary : colors.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subheading" style={primary && { color: colors.onPrimary }}>
          {loading ? 'Leyendo archivo…' : title}
        </Text>
        <Text variant="label" style={{ color: primary ? colors.onPrimary : colors.textSecondary, opacity: primary ? 0.85 : 1, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {body}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} tint={primary ? colors.onPrimary : colors.textTertiary} />
    </Pressable>
  );
}

function MappingStep({
  collection,
  fileName,
  table,
  onBack,
  onImport,
}: {
  collection: Collection;
  fileName: string;
  table: Table;
  onBack: () => void;
  onImport: (mapping: ColumnTarget[]) => void;
}) {
  const colors = useColors();
  const template = getTemplate(collection.templateId);
  const [mapping, setMapping] = useState<ColumnTarget[]>(() => autoMap(table, collection));
  const [choosing, setChoosing] = useState<number | null>(null);
  const preview = useMemo(() => buildImport(table, mapping, collection), [table, mapping, collection]);
  const hasTitle = mapping.some((m) => m.kind === 'title');
  const example = preview.items[0];

  const setTarget = (col: number, target: ColumnTarget) => {
    setMapping((m) =>
      m.map((t, i) => {
        if (i === col) return target;
        // Nombre, cantidad, notas y cada campo existente solo pueden venir de una columna.
        const sameSingle = target.kind !== 'new' && target.kind !== 'ignore' && t.kind === target.kind;
        const sameField = target.kind === 'field' && t.kind === 'field' && t.fieldId === target.fieldId;
        return (sameSingle && target.kind !== 'field') || sameField ? { kind: 'ignore' } : t;
      }),
    );
    setChoosing(null);
  };

  const choices: ColumnTarget[] =
    choosing === null
      ? []
      : [
          { kind: 'title' },
          { kind: 'quantity' },
          ...collection.fields.map((f): ColumnTarget => ({ kind: 'field', fieldId: f.id })),
          { kind: 'notes' },
          { kind: 'new', label: table.headers[choosing], type: 'text' },
          { kind: 'new', label: table.headers[choosing], type: 'select' },
          { kind: 'new', label: table.headers[choosing], type: 'number' },
          { kind: 'ignore' },
        ];

  const sameTarget = (a: ColumnTarget, b: ColumnTarget) =>
    a.kind === b.kind &&
    (a.kind !== 'field' || (b.kind === 'field' && a.fieldId === b.fieldId)) &&
    (a.kind !== 'new' || (b.kind === 'new' && a.type === b.type));

  return (
    <Screen
      header={<TopBar onBack={onBack} title="Acomodar columnas" subtitle={fileName} />}
      footer={
        <Button
          label={`Importar ${formatCount(preview.items.length)} ${preview.items.length === 1 ? template.itemNoun : template.itemNounPlural}`}
          size="lg"
          style={{ flex: 1 }}
          disabled={preview.items.length === 0}
          onPress={() => onImport(mapping)}
        />
      }>
      <Animated.View entering={FadeInRight.duration(250)} style={{ gap: space.lg, paddingTop: space.md }}>
        <Text variant="body" color="textSecondary">
          Encontramos {table.headers.length} {table.headers.length === 1 ? 'columna' : 'columnas'} y {formatCount(table.rows.length)}{' '}
          {table.rows.length === 1 ? 'fila' : 'filas'}. Revisá a dónde va cada columna: lo que no
          coincide con tu colección se crea como campo nuevo, así no perdés nada.
        </Text>

        {!hasTitle && (
          <View style={[styles.warning, { backgroundColor: colors.accentSoft }]}>
            <Icon name="information-circle-outline" size={20} color="accent" />
            <Text variant="label" style={{ flex: 1, fontFamily: 'PlusJakartaSans_500Medium' }}>
              Ninguna columna está marcada como Nombre. Vamos a armarlo con los primeros datos de cada fila.
            </Text>
          </View>
        )}

        <Card padded={false}>
          {table.headers.map((header, col) => {
            const target = mapping[col];
            const samples = table.rows
              .map((r) => r[col])
              .filter((v) => v !== null)
              .slice(0, 3)
              .map((v) => String(v));
            const ignored = target.kind === 'ignore';
            return (
              <View key={`${header}-${col}`}>
                {col > 0 && <Divider />}
                <View style={[styles.column, ignored && { opacity: 0.55 }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {header}
                    </Text>
                    <Text variant="caption" color="textTertiary" numberOfLines={1}>
                      {samples.length ? samples.join(' · ') : 'Sin datos'}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={16} color="textTertiary" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Columna ${header}: ${targetLabel(target, collection)}. Cambiar`}
                    onPress={() => setChoosing(col)}
                    style={({ pressed }) => [
                      styles.target,
                      {
                        backgroundColor: pressed ? colors.surfacePressed : target.kind === 'new' ? colors.accentSoft : colors.surfaceMuted,
                      },
                    ]}>
                    <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {targetLabel(target, collection)}
                    </Text>
                    <Icon name="chevron-down" size={14} color="textSecondary" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>

        {example && (
          <View style={{ gap: space.sm }}>
            <Text variant="overline" color="textTertiary">
              Así va a quedar la primera
            </Text>
            <Card style={{ gap: space.sm }}>
              <Text variant="heading">{example.title}</Text>
              <Text variant="label" color="textSecondary" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                {[
                  example.quantity > 1 ? `${example.quantity} ejemplares` : null,
                  ...preview.fields.map((f) => (example.values[f.id] !== undefined ? `${f.label}: ${displayValue(example.values[f.id])}` : null)),
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Sin datos extra'}
              </Text>
            </Card>
            {preview.skippedRows > 0 && (
              <Text variant="caption" color="textTertiary">
                Se saltean {preview.skippedRows} filas vacías.
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      <Sheet visible={choosing !== null} onClose={() => setChoosing(null)} title={choosing !== null ? `“${table.headers[choosing]}” va a…` : ''}>
        <View style={{ marginHorizontal: -space.xl }}>
          {choices.map((c, i) => {
            const selected = choosing !== null && sameTarget(mapping[choosing], c);
            return (
              <ListRow
                key={i}
                icon={
                  c.kind === 'ignore'
                    ? 'eye-off-outline'
                    : c.kind === 'new'
                      ? 'add-circle-outline'
                      : c.kind === 'title'
                        ? 'text-outline'
                        : c.kind === 'quantity'
                          ? 'layers-outline'
                          : 'pricetag-outline'
                }
                title={targetLabel(c, collection)}
                subtitle={c.kind === 'new' ? `Se agrega “${c.label}” a tu colección` : undefined}
                onPress={() => choosing !== null && setTarget(choosing, c)}
                right={selected ? <Icon name="checkmark-circle" size={22} color="primary" /> : <View />}
              />
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}

function DoneBadge() {
  const colors = useColors();
  return (
    <View style={[styles.doneBadge, { backgroundColor: colors.successSoft }]}>
      <View style={[styles.doneInner, { backgroundColor: colors.success }]}>
        <Icon name="checkmark" size={44} tint="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', gap: space.md, paddingTop: space.md, paddingBottom: space.xxl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  optionIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  overline: { marginTop: space.xxl, marginBottom: space.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  warning: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.lg, alignItems: 'center' },
  column: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    maxWidth: '48%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  done: { alignItems: 'center', gap: space.lg, paddingTop: space.huge },
  doneBadge: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  doneInner: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
});
