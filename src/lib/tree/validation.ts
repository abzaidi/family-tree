import type { Person, Union, UnionChild } from '@/types';

export function detectCycle(
    persons: Person[],
    unions: Union[],
    unionChildren: UnionChild[],
    childId: string,
    parentId: string
): boolean {
    // Check if adding parentId as a parent of childId would create a cycle
    // A cycle exists if parentId is a descendant of childId
    const visited = new Set<string>();

    const isDescendant = (personId: string, targetId: string): boolean => {
        if (personId === targetId) return true;
        if (visited.has(personId)) return false;
        visited.add(personId);

        const personUnions = unions.filter(
            (u) => u.partner1_id === personId || u.partner2_id === personId
        );

        for (const union of personUnions) {
            const children = unionChildren
                .filter((uc) => uc.union_id === union.id)
                .map((uc) => uc.child_id);

            for (const cid of children) {
                if (isDescendant(cid, targetId)) return true;
            }
        }

        return false;
    };

    return isDescendant(childId, parentId);
}

export function preventSelfParenting(personId: string, parentId: string): boolean {
    return personId === parentId;
}

export function checkDuplicateUnion(
    unions: Union[],
    partner1Id: string,
    partner2Id: string | null
): boolean {
    if (!partner2Id) return false;
    return unions.some(
        (u) =>
            (u.partner1_id === partner1Id && u.partner2_id === partner2Id) ||
            (u.partner1_id === partner2Id && u.partner2_id === partner1Id)
    );
}

export function checkDuplicateUnionChild(
    unionChildren: UnionChild[],
    unionId: string,
    childId: string
): boolean {
    return unionChildren.some(
        (uc) => uc.union_id === unionId && uc.child_id === childId
    );
}
