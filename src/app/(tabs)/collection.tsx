import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionSwitcher } from '@/components/collection-switcher';
import { FiltersSheet, sortOptions } from '@/components/filters-sheet';
import { EmptyBoxScene } from '@/components/illustrations/scenes';
import { ItemCard, ItemRow } from '@/components/item-views';
import { IconButton } from '@/components/ui/button';
import { EmptyState, notify, Tip } from '@/components/ui/feedback';
import { SearchBar } from '@/components/ui/inputs';
import { PageTitle, Sheet, TAB_BAR_SPACE } from '@/components/ui/layout';
import { Chip, ListRow } from '@/components/ui/surfaces';
import { Text } from '@/components/ui/text';
import { applyQuery, countActiveFilters, EMPTY_QUERY, isFilterActive, type Query } from '@/domain/search';
import { computeStats, formatCount } from '@/domain/stats';
import { getTemplate } from '@/domain/templates';
import type { Collection } from '@/domain/types';
import { buildExportWorkbook, buildTemplateWorkbook, fileSafeName } from '@/lib/excel/workbooks';
import { shareFile } from '@/lib/files';
import { useActiveCollection, useStore } from '@/store/store';
import { MAX_CONTENT_WIDTH, space } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

type ViewMode = 'grid' | 'list';

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const collection = useActiveCollection();
  const allItems = useStore((s) => s.items);
  const markMilestone = useStore((s) => s.markMilestone);
  const params = useLocalSearchParams<{ field?: string; value?: string }>();

  // Cada colección recuerda su propia búsqueda y filtros.
  const [queries, setQueries] = useState<Record<string, Query>>({});
  const query = (collection && queries[collection.id]) || EMPTY_QUERY;
  const setQuery = (next: Query) => collection && setQueries((q) => ({ ...q, [collection.id]: next }));
  const [mode, setMode] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Llegada desde "Conteos": abre la colección con ese filtro puesto.
  const incoming = params.field && params.value ? `${params.field}\u0000${params.value}` : null;
  const [handled, setHandled] = useState<string | null>(null);
  if (incoming !== handled) {
    setHandled(incoming);
    if (incoming && collection && params.field && params.value) {
      setQuery({ ...EMPTY_QUERY, filters: { [params.field]: { kind: 'values', values: [params.value] } } });
    }
  }
  useEffect(() => {
    if (incoming) router.setParams({ field: undefined, value: undefined });
  }, [incoming]);

  const items = useMemo(() => allItems.filter((i) => i.collectionId === collection?.id), [allItems, collection?.id]);
  const results = useMemo(
    () => (collection ? applyQuery(items, collection.fields, query) : []),
    [items, collection, query],
  );

  if (!collection) return null;

  const template = getTemplate(collection.templateId);
  const stats = computeStats(items);
  const activeFilters = countActiveFilters(query);
  const isFiltering = activeFilters > 0 || query.text.trim() !== '';
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - space.xl * 2;
  const columns = contentWidth > 520 ? 3 : 2;

  const updateQuery = (next: Query) => {
    setQuery(next);
    if (countActiveFilters(next) > 0) markMilestone('usedFilters');
  };

  const removeFilter = (fieldId: string) => {
    const filters = { ...query.filters };
    delete filters[fieldId];
    setQuery({ ...query, filters });
  };

  const header = (
    <View>
      <PageTitle
        title={collection.name}
        subtitle={`${formatCount(stats.unique)} distintas · ${formatCount(stats.total)} en total`}
        right={
          <View style={styles.titleActions}>
            <IconButton
              icon={mode === 'grid' ? 'list-outline' : 'grid-outline'}
              label={mode === 'grid' ? 'Ver como lista' : 'Ver como grilla'}
              onPress={() => setMode(mode === 'grid' ? 'list' : 'grid')}
            />
            <IconButton icon="ellipsis-horizontal" label="Más opciones" onPress={() => setMenuOpen(true)} />
          </View>
        }
      />
      <CollectionSwitcher activeId={collection.id} />
      {items.length > 0 && (
        <Tip
          id="collection-filters"
          icon="options-outline"
          title="Búsquedas cruzadas"
          message="Escribí cualquier dato en el buscador o tocá Filtros para combinar país, marca, año y más."
        />
      )}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query.text}
            onChangeText={(text) => {
              setQuery({ ...query, text });
              if (text.trim()) markMilestone('usedFilters');
            }}
            placeholder={`Buscar ${template.itemNounPlural}…`}
          />
        </View>
        <IconButton icon="options-outline" label="Filtros y orden" onPress={() => setFiltersOpen(true)} size={48} badge={activeFilters} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {query.onlyDuplicates && (
          <Chip label="Solo repetidas" selected onRemove={() => setQuery({ ...query, onlyDuplicates: false })} />
        )}
        {Object.entries(query.filters)
          .filter(([, f]) => isFilterActive(f))
          .map(([fieldId, f]) => {
            const field = collection.fields.find((x) => x.id === fieldId);
            const label =
              f.kind === 'values'
                ? f.values.join(', ')
                : [f.min !== undefined && `desde ${f.min}`, f.max !== undefined && `hasta ${f.max}`].filter(Boolean).join(' ');
            return <Chip key={fieldId} label={`${field?.label ?? fieldId}: ${label}`} selected onRemove={() => removeFilter(fieldId)} />;
          })}
        <Chip
          label={sortOptions(collection).find((o) => o.value === query.sort)?.label ?? 'Ordenar'}
          icon="swap-vertical"
          onPress={() => setFiltersOpen(true)}
        />
      </ScrollView>
      {items.length > 0 && (
        <Text variant="label" color="textSecondary" style={styles.count}>
          {isFiltering
            ? `${formatCount(results.length)} de ${formatCount(items.length)} ${template.itemNounPlural}`
            : `${formatCount(items.length)} ${items.length === 1 ? template.itemNoun : template.itemNounPlural}`}
        </Text>
      )}
    </View>
  );

  const empty =
    items.length === 0 ? (
      <EmptyState
        illustration={<EmptyBoxScene />}
        title="Tu colección está vacía"
        message={`Cargá tu primera ${template.itemNoun} o traé todas de una desde un Excel.`}
        actionLabel={`Agregar ${template.itemNoun}`}
        onAction={() => router.push('/item/form')}
        secondaryLabel="Importar desde Excel"
        onSecondary={() => router.push({ pathname: '/collections/[id]/import', params: { id: collection.id } })}
      />
    ) : (
      <EmptyState
        title="No hay coincidencias"
        message="Probá con otra búsqueda o sacá algún filtro."
        secondaryLabel="Limpiar filtros"
        onSecondary={() => setQuery({ ...EMPTY_QUERY, sort: query.sort })}
      />
    );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        key={`${mode}-${columns}`}
        data={results}
        keyExtractor={(i) => i.id}
        numColumns={mode === 'grid' ? columns : 1}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={mode === 'grid' ? { gap: space.md } : undefined}
        contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_SPACE + insets.bottom + space.xl }]}
        renderItem={({ item }) =>
          mode === 'grid' ? (
            <View style={{ flex: 1 / columns }}>
              <ItemCard item={item} collection={collection} />
            </View>
          ) : (
            <ItemRow item={item} collection={collection} />
          )
        }
      />
      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        collection={collection}
        items={items}
        query={query}
        onApply={updateQuery}
      />
      <CollectionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} collection={collection} />
    </View>
  );
}

function CollectionMenu({ visible, onClose, collection }: { visible: boolean; onClose: () => void; collection: Collection }) {
  const items = useStore((s) => s.items);
  const go = (pathname: '/collections/[id]/edit' | '/collections/[id]/import' | '/collections/[id]/stats') => {
    onClose();
    router.push({ pathname, params: { id: collection.id } });
  };
  const share = async (kind: 'export' | 'template') => {
    onClose();
    try {
      const bytes =
        kind === 'export'
          ? buildExportWorkbook(collection, items.filter((i) => i.collectionId === collection.id))
          : buildTemplateWorkbook(collection);
      const suffix = kind === 'export' ? '' : '-planilla-modelo';
      await shareFile(bytes, `${fileSafeName(collection.name)}${suffix}.xlsx`);
    } catch (e) {
      notify('No se pudo generar el archivo', e instanceof Error ? e.message : 'Probá de nuevo.');
    }
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={collection.name}>
      <View style={styles.menu}>
        <ListRow icon="stats-chart-outline" title="Conteos y estadísticas" subtitle="Cuántas tenés por país, marca, año…" onPress={() => go('/collections/[id]/stats')} />
        <ListRow icon="construct-outline" title="Editar campos y colección" subtitle="Agregá o quitá los datos que cargás" onPress={() => go('/collections/[id]/edit')} />
        <ListRow icon="cloud-upload-outline" title="Importar desde Excel" subtitle="Subí tu planilla o un CSV" onPress={() => go('/collections/[id]/import')} />
        <ListRow icon="share-outline" title="Exportar a Excel" subtitle="Un archivo con toda la colección" onPress={() => share('export')} />
        <ListRow icon="download-outline" title="Bajar planilla modelo" subtitle="Para completar y volver a subir" onPress={() => share('template')} />
        <ListRow
          icon="add-circle-outline"
          title="Nueva colección"
          onPress={() => {
            onClose();
            router.push('/collections/new');
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: space.xl, gap: space.md },
  titleActions: { flexDirection: 'row', gap: space.sm },
  searchRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  chipScroll: { marginHorizontal: -space.xl, marginTop: space.md, flexGrow: 0 },
  chipRow: { gap: space.sm, paddingHorizontal: space.xl },
  count: { marginTop: space.lg, marginBottom: space.xs },
  menu: { marginHorizontal: -space.xl },
});
