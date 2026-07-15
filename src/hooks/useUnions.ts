'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTreeStore } from '@/store/tree-store';
import type { Union, UnionChild } from '@/types';
import { toast } from 'sonner';

export function useUnions() {
    const supabase = createClient();

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
        []
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
        []
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
        addChildToUnion,
        findUnionBetween,
        getUnionsForPerson,
        getChildrenOfUnion,
        getParentUnion,
    };
}
