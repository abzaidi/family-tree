'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTreeStore } from '@/store/tree-store';
import type { Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

export function usePersons() {
    const supabase = createClient();
    const { setPersons, addPerson, updatePerson, removePerson, persons, unions, unionChildren } =
        useTreeStore();

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
    }, []);

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
            addPerson(person);
            return person;
        },
        []
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
            updatePerson(person);
            return true;
        },
        []
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

            toDelete.forEach((id) => removePerson(id));
            return true;
        },
        []
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
        []
    );

    return { fetchAll, createPerson, editPerson, softDeleteBranch, getDescendantCount, setRootPerson };
}
