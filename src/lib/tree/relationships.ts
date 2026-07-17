import type { Person, Union, UnionChild } from '@/types';

/** Serial of the fixed export ancestor (FT-000007). */
export const EXPORT_ROOT_SERIAL = 7;

export interface RelationshipIndex {
    personById: Map<string, Person>;
    unionsById: Map<string, Union>;
    unionsByPerson: Map<string, Union[]>;
    childrenByUnion: Map<string, string[]>;
    parentUnionByChild: Map<string, string>;
}

export function buildRelationshipIndex(
    persons: Person[],
    unions: Union[],
    unionChildren: UnionChild[]
): RelationshipIndex {
    const personById = new Map<string, Person>();
    for (const person of persons) {
        if (!person.deleted) personById.set(person.id, person);
    }

    const unionsById = new Map<string, Union>();
    const unionsByPerson = new Map<string, Union[]>();
    for (const union of unions) {
        unionsById.set(union.id, union);
        const partners = [union.partner1_id, union.partner2_id].filter(
            (id): id is string => Boolean(id)
        );
        for (const partnerId of partners) {
            if (!personById.has(partnerId)) continue;
            const list = unionsByPerson.get(partnerId) ?? [];
            list.push(union);
            unionsByPerson.set(partnerId, list);
        }
    }

    const childrenByUnion = new Map<string, string[]>();
    const parentUnionByChild = new Map<string, string>();
    for (const link of unionChildren) {
        if (!personById.has(link.child_id)) continue;
        const list = childrenByUnion.get(link.union_id) ?? [];
        list.push(link.child_id);
        childrenByUnion.set(link.union_id, list);
        parentUnionByChild.set(link.child_id, link.union_id);
    }

    return {
        personById,
        unionsById,
        unionsByPerson,
        childrenByUnion,
        parentUnionByChild,
    };
}

export function findPersonBySerial(
    index: RelationshipIndex,
    serial: number
): Person | null {
    for (const person of index.personById.values()) {
        if (person.serial_number === serial) return person;
    }
    return null;
}

export function getParents(
    index: RelationshipIndex,
    personId: string
): Person[] {
    const unionId = index.parentUnionByChild.get(personId);
    if (!unionId) return [];
    const parentUnion = index.unionsById.get(unionId);
    if (!parentUnion) return [];

    const parents: Person[] = [];
    const p1 = index.personById.get(parentUnion.partner1_id);
    if (p1) parents.push(p1);
    if (parentUnion.partner2_id) {
        const p2 = index.personById.get(parentUnion.partner2_id);
        if (p2) parents.push(p2);
    }
    return parents;
}

export function getSpouses(
    index: RelationshipIndex,
    personId: string
): Person[] {
    const unions = index.unionsByPerson.get(personId) ?? [];
    const spouses: Person[] = [];
    for (const union of unions) {
        const spouseId =
            union.partner1_id === personId
                ? union.partner2_id
                : union.partner1_id;
        if (!spouseId) continue;
        const spouse = index.personById.get(spouseId);
        if (spouse) spouses.push(spouse);
    }
    return spouses;
}

export function getChildren(
    index: RelationshipIndex,
    personId: string
): Person[] {
    const unions = index.unionsByPerson.get(personId) ?? [];
    const children: Person[] = [];
    const seen = new Set<string>();
    for (const union of unions) {
        for (const childId of index.childrenByUnion.get(union.id) ?? []) {
            if (seen.has(childId)) continue;
            const child = index.personById.get(childId);
            if (!child) continue;
            seen.add(childId);
            children.push(child);
        }
    }
    return children;
}

/** Prefer father; if none, use the sole mother (single-parent case). */
export function chooseLineageParent(parents: Person[]): Person | null {
    if (parents.length === 0) return null;
    const males = parents.filter((p) => p.gender === 'male');
    if (males.length > 0) return males[0];
    const females = parents.filter((p) => p.gender === 'female');
    if (females.length === 1) return females[0];
    return parents[0];
}

/**
 * Ascend from selected toward export root, preferring male parents.
 * Returns [exportRoot, ..., selected] or null if the root is not an ancestor.
 */
export function findExportAncestralChain(
    index: RelationshipIndex,
    exportRootId: string,
    selectedId: string
): Person[] | null {
    if (!index.personById.has(exportRootId) || !index.personById.has(selectedId)) {
        return null;
    }
    if (exportRootId === selectedId) {
        return [index.personById.get(selectedId)!];
    }

    const upward: Person[] = [];
    let currentId = selectedId;
    const guard = new Set<string>();

    while (currentId !== exportRootId) {
        if (guard.has(currentId)) return null;
        guard.add(currentId);

        const current = index.personById.get(currentId);
        if (!current) return null;
        upward.push(current);

        const parent = chooseLineageParent(getParents(index, currentId));
        if (!parent) return null;
        currentId = parent.id;
    }

    const root = index.personById.get(exportRootId)!;
    return [root, ...upward.reverse()];
}

export function isExportEligible(
    index: RelationshipIndex,
    person: Person
): boolean {
    if (person.serial_number < EXPORT_ROOT_SERIAL) return false;
    const root = findPersonBySerial(index, EXPORT_ROOT_SERIAL);
    if (!root) return false;
    return findExportAncestralChain(index, root.id, person.id) !== null;
}

export interface DescendantSubtree {
    /** Blood descendants including the selected root, generation-ordered. */
    bloodIds: string[];
    /** Spouses of blood members (not walked for further unrelated children). */
    spouseIds: string[];
}

/**
 * Collect blood descendants of selected plus their spouses.
 * Does not recurse into a spouse's other marriages' children.
 */
export function collectDescendantSubtree(
    index: RelationshipIndex,
    selectedId: string
): DescendantSubtree {
    const bloodIds: string[] = [];
    const spouseIds: string[] = [];
    const bloodSet = new Set<string>();
    const spouseSet = new Set<string>();
    const queue = [selectedId];

    while (queue.length > 0) {
        const id = queue.shift()!;
        if (bloodSet.has(id)) continue;
        if (!index.personById.has(id)) continue;
        bloodSet.add(id);
        bloodIds.push(id);

        for (const spouse of getSpouses(index, id)) {
            if (!spouseSet.has(spouse.id) && !bloodSet.has(spouse.id)) {
                spouseSet.add(spouse.id);
                spouseIds.push(spouse.id);
            }
        }

        for (const child of getChildren(index, id)) {
            if (!bloodSet.has(child.id)) queue.push(child.id);
        }
    }

    return { bloodIds, spouseIds };
}
