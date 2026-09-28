import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/domain/id';
import type { Collection, FieldDef, Item } from '@/domain/types';
import { deletePhotos } from '@/lib/photos';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Hitos de la guía de primeros pasos que no se pueden deducir de los datos. */
export type Milestone = 'usedFilters' | 'editedFields' | 'importedExcel';

export type ItemDraft = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

interface PersistedState {
  onboardingDone: boolean;
  profileName: string;
  themePreference: ThemePreference;
  collections: Collection[];
  items: Item[];
  activeCollectionId: string | null;
  dismissedTips: string[];
  milestones: Milestone[];
  checklistHidden: boolean;
}

interface Actions {
  completeOnboarding: (profileName: string, collection: Collection) => void;
  replayOnboarding: () => void;
  setProfileName: (name: string) => void;
  setThemePreference: (pref: ThemePreference) => void;

  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, patch: Partial<Omit<Collection, 'id'>>) => void;
  setFields: (id: string, fields: FieldDef[]) => void;
  deleteCollection: (id: string) => void;
  setActiveCollection: (id: string) => void;

  addItem: (draft: ItemDraft) => Item;
  updateItem: (id: string, patch: Partial<ItemDraft>) => void;
  deleteItem: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
  importItems: (collectionId: string, fields: FieldDef[], items: Item[]) => void;

  dismissTip: (tip: string) => void;
  markMilestone: (milestone: Milestone) => void;
  hideChecklist: () => void;
  showTipsAgain: () => void;
  resetAll: () => void;
}

export type AppState = PersistedState & Actions & { hydrated: boolean };

const initialState: PersistedState = {
  onboardingDone: false,
  profileName: '',
  themePreference: 'system',
  collections: [],
  items: [],
  activeCollectionId: null,
  dismissedTips: [],
  milestones: [],
  checklistHidden: false,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,

      completeOnboarding: (profileName, collection) =>
        set((s) => ({
          onboardingDone: true,
          profileName: profileName.trim(),
          collections: [...s.collections, collection],
          activeCollectionId: collection.id,
        })),
      replayOnboarding: () => set({ onboardingDone: false }),
      setProfileName: (profileName) => set({ profileName: profileName.trim() }),
      setThemePreference: (themePreference) => set({ themePreference }),

      addCollection: (collection) =>
        set((s) => ({ collections: [...s.collections, collection], activeCollectionId: collection.id })),
      updateCollection: (id, patch) =>
        set((s) => ({
          collections: s.collections.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
        })),
      setFields: (id, fields) => {
        get().updateCollection(id, { fields });
        get().markMilestone('editedFields');
      },
      deleteCollection: (id) => {
        const { items, collections, activeCollectionId } = get();
        deletePhotos(items.filter((i) => i.collectionId === id).flatMap((i) => i.photos));
        const remaining = collections.filter((c) => c.id !== id);
        set({
          collections: remaining,
          items: items.filter((i) => i.collectionId !== id),
          activeCollectionId: activeCollectionId === id ? (remaining[0]?.id ?? null) : activeCollectionId,
        });
      },
      setActiveCollection: (activeCollectionId) => set({ activeCollectionId }),

      addItem: (draft) => {
        const now = Date.now();
        const item: Item = { ...draft, id: createId(), createdAt: now, updatedAt: now };
        set((s) => ({ items: [item, ...s.items] }));
        return item;
      },
      updateItem: (id, patch) => {
        const previous = get().items.find((i) => i.id === id);
        if (previous && patch.photos) {
          deletePhotos(previous.photos.filter((p) => !patch.photos!.includes(p)));
        }
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)),
        }));
      },
      deleteItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) deletePhotos(item.photos);
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },
      changeQuantity: (id, delta) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta), updatedAt: Date.now() } : i,
          ),
        })),
      importItems: (collectionId, fields, items) => {
        get().updateCollection(collectionId, { fields });
        set((s) => ({ items: [...items, ...s.items] }));
        get().markMilestone('importedExcel');
      },

      dismissTip: (tip) =>
        set((s) => (s.dismissedTips.includes(tip) ? s : { dismissedTips: [...s.dismissedTips, tip] })),
      markMilestone: (milestone) =>
        set((s) => (s.milestones.includes(milestone) ? s : { milestones: [...s.milestones, milestone] })),
      hideChecklist: () => set({ checklistHidden: true }),
      showTipsAgain: () => set({ dismissedTips: [], checklistHidden: false }),
      resetAll: () => {
        deletePhotos(get().items.flatMap((i) => i.photos));
        set(initialState);
      },
    }),
    {
      name: 'vitrina-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        onboardingDone: s.onboardingDone,
        profileName: s.profileName,
        themePreference: s.themePreference,
        collections: s.collections,
        items: s.items,
        activeCollectionId: s.activeCollectionId,
        dismissedTips: s.dismissedTips,
        milestones: s.milestones,
        checklistHidden: s.checklistHidden,
      }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

export function useActiveCollection(): Collection | undefined {
  return useStore((s) => s.collections.find((c) => c.id === s.activeCollectionId) ?? s.collections[0]);
}
