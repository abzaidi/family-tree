import { create } from 'zustand';
import type { Person, Union, UnionChild } from '@/types';

interface TreeState {
    // Data
    persons: Person[];
    unions: Union[];
    unionChildren: UnionChild[];

    // UI state
    expandedNodeIds: Set<string>;
    selectedPersonId: string | null;
    rootPersonId: string | null;
    isDrawerOpen: boolean;
    isSearchOpen: boolean;

    // Data actions
    setPersons: (persons: Person[]) => void;
    setUnions: (unions: Union[]) => void;
    setUnionChildren: (unionChildren: UnionChild[]) => void;
    setRootPersonId: (id: string | null) => void;

    // Person CRUD helpers
    addPerson: (person: Person) => void;
    updatePerson: (person: Person) => void;
    removePerson: (id: string) => void;

    // Union CRUD helpers
    addUnion: (union: Union) => void;
    addUnionChild: (uc: UnionChild) => void;

    // UI actions
    selectPerson: (id: string | null) => void;
    toggleNode: (id: string) => void;
    expandNode: (id: string) => void;
    collapseNode: (id: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    setDrawerOpen: (open: boolean) => void;
    setSearchOpen: (open: boolean) => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
    persons: [],
    unions: [],
    unionChildren: [],
    expandedNodeIds: new Set<string>(),
    selectedPersonId: null,
    rootPersonId: null,
    isDrawerOpen: false,
    isSearchOpen: false,

    setPersons: (persons) => set({ persons }),
    setUnions: (unions) => set({ unions }),
    setUnionChildren: (unionChildren) => set({ unionChildren }),
    setRootPersonId: (id) => set({ rootPersonId: id }),

    addPerson: (person) =>
        set((state) => ({ persons: [...state.persons, person] })),
    updatePerson: (person) =>
        set((state) => ({
            persons: state.persons.map((p) => (p.id === person.id ? person : p)),
        })),
    removePerson: (id) =>
        set((state) => ({
            persons: state.persons.map((p) =>
                p.id === id ? { ...p, deleted: true } : p
            ),
        })),

    addUnion: (union) =>
        set((state) => ({ unions: [...state.unions, union] })),
    addUnionChild: (uc) =>
        set((state) => ({ unionChildren: [...state.unionChildren, uc] })),

    selectPerson: (id) => set({ selectedPersonId: id, isDrawerOpen: id !== null }),
    toggleNode: (id) =>
        set((state) => {
            const next = new Set(state.expandedNodeIds);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return { expandedNodeIds: next };
        }),
    expandNode: (id) =>
        set((state) => {
            const next = new Set(state.expandedNodeIds);
            next.add(id);
            return { expandedNodeIds: next };
        }),
    collapseNode: (id) =>
        set((state) => {
            const next = new Set(state.expandedNodeIds);
            next.delete(id);
            return { expandedNodeIds: next };
        }),
    expandAll: () =>
        set((state) => ({
            expandedNodeIds: new Set(
                state.persons.filter((p) => !p.deleted).map((p) => p.id)
            ),
        })),
    collapseAll: () => set({ expandedNodeIds: new Set<string>() }),
    setDrawerOpen: (open) =>
        set({ isDrawerOpen: open, selectedPersonId: open ? get().selectedPersonId : null }),
    setSearchOpen: (open) => set({ isSearchOpen: open }),
}));
