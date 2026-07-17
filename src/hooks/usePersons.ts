'use client';

import { useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTreeStore } from '@/store/tree-store';
import type { DeleteContext, DeleteOnlyMode, Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

export function usePersons() {
    const supabase = useMemo(() => createClient(), []);

    const getLineageIds = useCallback((): Set<string> => {
        const state = useTreeStore.getState();
        const lineage = new Set<string>();
        if (!state.rootPersonId) return lineage;

        const queue = [state.rootPersonId];
        while (queue.length > 0) {
            const personId = queue.shift()!;
            if (lineage.has(personId)) continue;

            const person = state.persons.find((p) => p.id === personId);
            if (!person || person.deleted) continue;

            lineage.add(personId);

            // Follow children only — spouses are collateral, not lineage nodes.
            const personUnions = state.unions.filter(
                (union) =>
                    union.partner1_id === personId ||
                    union.partner2_id === personId
            );
            for (const union of personUnions) {
                for (const link of state.unionChildren) {
                    if (link.union_id !== union.id) continue;
                    const child = state.persons.find((p) => p.id === link.child_id);
                    if (child && !child.deleted && !lineage.has(child.id)) {
                        queue.push(child.id);
                    }
                }
            }
        }

        return lineage;
    }, []);

    const hasDirectChildren = useCallback((personId: string): boolean => {
        const state = useTreeStore.getState();
        const personUnions = state.unions.filter(
            (union) =>
                union.partner1_id === personId || union.partner2_id === personId
        );
        return personUnions.some((union) =>
            state.unionChildren.some((link) => {
                if (link.union_id !== union.id) return false;
                const child = state.persons.find((p) => p.id === link.child_id);
                return Boolean(child && !child.deleted);
            })
        );
    }, []);

    const fetchAll = useCallback(async () => {
        const [personsRes, unionsRes, ucRes, configRes] = await Promise.all([
            supabase.from('persons').select('*').eq('deleted', false).order('created_at'),
            supabase.from('unions').select('*'),
            supabase.from('union_children').select('*'),
            supabase.from('app_config').select('*').eq('key', 'root_person_id').single(),
        ]);

        if (personsRes.data) useTreeStore.getState().setPersons(personsRes.data);
        if (unionsRes.data) useTreeStore.getState().setUnions(unionsRes.data);
        if (ucRes.data) useTreeStore.getState().setUnionChildren(ucRes.data);
        if (configRes.data) useTreeStore.getState().setRootPersonId(configRes.data.value);
    }, [supabase]);

    const createPerson = useCallback(
        async (data: PersonFormData): Promise<Person | null> => {
            const { data: person, error } = await supabase
                .from('persons')
                .insert({
                    english_name: data.english_name,
                    urdu_name: data.urdu_name,
                    gender: data.gender,
                    birth_year: data.birth_year,
                    death_year: data.death_year,
                    notes: data.notes || null,
                })
                .select()
                .single();

            if (error) {
                toast.error(error.message);
                return null;
            }
            useTreeStore.getState().addPerson(person);
            return person;
        },
        [supabase]
    );

    const editPerson = useCallback(
        async (id: string, data: Partial<PersonFormData>): Promise<boolean> => {
            const { data: person, error } = await supabase
                .from('persons')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                toast.error(error.message);
                return false;
            }
            useTreeStore.getState().updatePerson(person);
            return true;
        },
        [supabase]
    );

    const getDescendantCount = useCallback(
        (personId: string): number => {
            const state = useTreeStore.getState();
            const visited = new Set<string>();

            const countDescendants = (pid: string): number => {
                if (visited.has(pid)) return 0;
                visited.add(pid);

                let count = 0;
                const personUnions = state.unions.filter(
                    (u) => u.partner1_id === pid || u.partner2_id === pid
                );

                for (const union of personUnions) {
                    const children = state.unionChildren
                        .filter((uc) => uc.union_id === union.id)
                        .map((uc) => uc.child_id);

                    for (const childId of children) {
                        const child = state.persons.find((p) => p.id === childId);
                        if (child && !child.deleted) {
                            count += 1 + countDescendants(childId);
                        }
                    }
                }
                return count;
            };

            return countDescendants(personId);
        },
        []
    );

    const getDeleteContext = useCallback(
        (personId: string): DeleteContext => {
            const state = useTreeStore.getState();
            const lineageIds = getLineageIds();
            const isRoot = state.rootPersonId === personId;
            const isLineageMember = lineageIds.has(personId);
            const branching = hasDirectChildren(personId);
            const isBranchingParent = isLineageMember && branching;
            const descendantCount = getDescendantCount(personId);
            const deleteOnlyMode: DeleteOnlyMode =
                isBranchingParent && !isRoot ? 'lineage' : 'spouse';

            return {
                personId,
                isRoot,
                isLineageMember,
                isBranchingParent,
                // Root has no grandparents to receive children, so single-delete
                // is disabled and only whole-branch deletion remains.
                canDeleteOnly: !isRoot,
                canDeleteBranch: isRoot || isBranchingParent,
                deleteOnlyMode,
                descendantCount,
            };
        },
        [getDescendantCount, getLineageIds, hasDirectChildren]
    );

    const softDeleteBranch = useCallback(
        async (personId: string): Promise<boolean> => {
            const state = useTreeStore.getState();
            const toDelete: string[] = [];
            const visited = new Set<string>();

            const collectDescendants = (pid: string) => {
                if (visited.has(pid)) return;
                visited.add(pid);
                toDelete.push(pid);

                const personUnions = state.unions.filter(
                    (u) => u.partner1_id === pid || u.partner2_id === pid
                );

                for (const union of personUnions) {
                    const children = state.unionChildren
                        .filter((uc) => uc.union_id === union.id)
                        .map((uc) => uc.child_id);

                    for (const childId of children) {
                        const child = state.persons.find((p) => p.id === childId);
                        if (child && !child.deleted) {
                            collectDescendants(childId);
                        }
                    }
                }
            };

            collectDescendants(personId);

            const { error } = await supabase
                .from('persons')
                .update({ deleted: true, updated_at: new Date().toISOString() })
                .in('id', toDelete);

            if (error) {
                toast.error(error.message);
                return false;
            }

            toDelete.forEach((id) => useTreeStore.getState().removePerson(id));
            return true;
        },
        [supabase]
    );

    const deletePersonOnly = useCallback(
        async (
            personId: string,
            deleteMode: DeleteOnlyMode
        ): Promise<boolean> => {
            const { error } = await supabase.rpc('delete_person_only', {
                target_person_id: personId,
                delete_mode: deleteMode,
            });

            if (error) {
                toast.error(error.message);
                return false;
            }

            await fetchAll();
            return true;
        },
        [fetchAll, supabase]
    );

    const insertPersonInMiddle = useCallback(
        async (
            data: PersonFormData,
            parentId: string,
            childId: string
        ): Promise<boolean> => {
            const { error } = await supabase.rpc('insert_person_in_middle', {
                selected_parent_id: parentId,
                selected_child_id: childId,
                new_english_name: data.english_name,
                new_urdu_name: data.urdu_name,
                new_gender: data.gender,
                new_birth_year: data.birth_year,
                new_death_year: data.death_year,
                new_notes: data.notes || null,
            });

            if (error) {
                toast.error(error.message);
                return false;
            }

            await fetchAll();
            return true;
        },
        [fetchAll, supabase]
    );

    const setRootPerson = useCallback(
        async (personId: string): Promise<boolean> => {
            const { error } = await supabase
                .from('app_config')
                .upsert({ key: 'root_person_id', value: personId });

            if (error) {
                toast.error(error.message);
                return false;
            }
            useTreeStore.getState().setRootPersonId(personId);
            return true;
        },
        [supabase]
    );

    return {
        fetchAll,
        createPerson,
        editPerson,
        softDeleteBranch,
        deletePersonOnly,
        insertPersonInMiddle,
        getDescendantCount,
        getDeleteContext,
        setRootPerson,
    };
}
