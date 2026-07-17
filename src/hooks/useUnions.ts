'use client';

import { useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTreeStore } from '@/store/tree-store';
import type { Union, UnionChild } from '@/types';
import { toast } from 'sonner';

export function useUnions() {
    const supabase = useMemo(() => createClient(), []);

    const createUnion = useCallback(
        async (partner1Id: string, partner2Id: string | null, marriageDate?: string): Promise<Union | null> => {
            const { data: union, error } = await supabase
                .from('unions')
                .insert({
                    partner1_id: partner1Id,
                    partner2_id: partner2Id,
                    marriage_date: marriageDate || null,
                })
                .select()
                .single();

            if (error) {
                toast.error(error.message);
                return null;
            }
            useTreeStore.getState().addUnion(union);
            return union;
        },
        [supabase]
    );

    const addChildToUnion = useCallback(
        async (unionId: string, childId: string): Promise<UnionChild | null> => {
            const { data: uc, error } = await supabase
                .from('union_children')
                .insert({ union_id: unionId, child_id: childId })
                .select()
                .single();

            if (error) {
                toast.error(error.message);
                return null;
            }
            useTreeStore.getState().addUnionChild(uc);
            return uc;
        },
        [supabase]
    );

    const createSpouseUnion = useCallback(
        async (
            personId: string,
            spouseId: string,
            childIds: string[]
        ): Promise<Union | null> => {
            const state = useTreeStore.getState();
            const selectedIds = [...new Set(childIds)];
            const selectedLinks = state.unionChildren.filter((link) =>
                selectedIds.includes(link.child_id)
            );
            const sourceUnionIds = new Set(
                selectedLinks.map((link) => link.union_id)
            );
            const sourceUnions = state.unions.filter((union) =>
                sourceUnionIds.has(union.id)
            );

            const selectionsAreValid =
                selectedLinks.length === selectedIds.length &&
                sourceUnions.every(
                    (union) =>
                        union.partner1_id === personId &&
                        union.partner2_id === null
                );

            if (!selectionsAreValid) {
                toast.error('Some selected children are no longer eligible');
                return null;
            }

            // If every child in one single-parent union was selected, turn that
            // existing union into the couple. This avoids leaving an empty union.
            if (sourceUnions.length === 1) {
                const sourceUnion = sourceUnions[0];
                const sourceChildIds = state.unionChildren
                    .filter((link) => link.union_id === sourceUnion.id)
                    .map((link) => link.child_id);
                const selectedSet = new Set(selectedIds);
                const allSourceChildrenSelected =
                    sourceChildIds.length === selectedIds.length &&
                    sourceChildIds.every((id) => selectedSet.has(id));

                if (allSourceChildrenSelected) {
                    const { data: updatedUnion, error } = await supabase
                        .from('unions')
                        .update({ partner2_id: spouseId })
                        .eq('id', sourceUnion.id)
                        .select()
                        .single();

                    if (error) {
                        toast.error(error.message);
                        return null;
                    }

                    useTreeStore.getState().updateUnion(updatedUnion);
                    return updatedUnion;
                }
            }

            const { data: newUnion, error: unionError } = await supabase
                .from('unions')
                .insert({
                    partner1_id: personId,
                    partner2_id: spouseId,
                    marriage_date: null,
                })
                .select()
                .single();

            if (unionError) {
                toast.error(unionError.message);
                return null;
            }

            if (selectedIds.length > 0) {
                const { error: moveError } = await supabase
                    .from('union_children')
                    .update({ union_id: newUnion.id })
                    .in('child_id', selectedIds);

                if (moveError) {
                    toast.error(moveError.message);
                    return null;
                }
            }

            const latestState = useTreeStore.getState();
            latestState.addUnion(newUnion);
            latestState.moveUnionChildren(selectedIds, newUnion.id);
            return newUnion;
        },
        [supabase]
    );

    const findUnionBetween = useCallback(
        (personId1: string, personId2: string): Union | undefined => {
            const state = useTreeStore.getState();
            return state.unions.find(
                (u) =>
                    (u.partner1_id === personId1 && u.partner2_id === personId2) ||
                    (u.partner1_id === personId2 && u.partner2_id === personId1)
            );
        },
        []
    );

    const getUnionsForPerson = useCallback(
        (personId: string): Union[] => {
            const state = useTreeStore.getState();
            return state.unions.filter(
                (u) => u.partner1_id === personId || u.partner2_id === personId
            );
        },
        []
    );

    const getChildrenOfUnion = useCallback(
        (unionId: string): string[] => {
            const state = useTreeStore.getState();
            return state.unionChildren
                .filter((uc) => uc.union_id === unionId)
                .map((uc) => uc.child_id);
        },
        []
    );

    const getParentUnion = useCallback(
        (childId: string): UnionChild | undefined => {
            const state = useTreeStore.getState();
            return state.unionChildren.find((uc) => uc.child_id === childId);
        },
        []
    );

    return {
        createUnion,
        createSpouseUnion,
        addChildToUnion,
        findUnionBetween,
        getUnionsForPerson,
        getChildrenOfUnion,
        getParentUnion,
    };
}
