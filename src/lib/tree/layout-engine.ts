import type { Person, Union, UnionChild } from '@/types';
import type { Node, Edge } from '@xyflow/react';

// Layout Constants
const NODE_WIDTH = 260;
const NODE_HEIGHT = 110;
const UNION_NODE_SIZE = 24;
const H_GAP = 80;
const V_GAP = 140;
const SPOUSE_GAP = 320;
const COUPLE_WIDTH = SPOUSE_GAP + NODE_WIDTH;
const EDGE_STYLE = { stroke: 'var(--tree-edge)', strokeWidth: 2 };

export interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

export function buildTreeLayout(
    persons: Person[],
    unions: Union[],
    unionChildren: UnionChild[],
    rootPersonId: string | null,
    expandedNodeIds: Set<string>
): LayoutResult {
    if (!rootPersonId || persons.length === 0) return { nodes: [], edges: [] };

    const personMap = new Map<string, Person>();
    persons.forEach((p) => personMap.set(p.id, p));
    if (!personMap.has(rootPersonId)) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const positioned = new Map<string, { x: number; y: number }>();
    const processedUnions = new Set<string>();

    function getPersonUnions(personId: string): Union[] {
        return unions.filter(u => u.partner1_id === personId || u.partner2_id === personId);
    }

    function getUnionChildren(unionId: string): string[] {
        return unionChildren.filter(uc => uc.union_id === unionId).map(uc => uc.child_id);
    }

    function getSpouseId(union: Union, personId: string): string | null {
        return union.partner1_id === personId ? union.partner2_id : union.partner1_id;
    }

    // A traversed node can expand if any of its unions has a visible spouse or child
    function isExpandable(personId: string): boolean {
        return getPersonUnions(personId).some((union) => {
            const spouseId = getSpouseId(union, personId);
            if (spouseId) {
                const spouse = personMap.get(spouseId);
                if (spouse && !spouse.deleted) return true;
            }
            return getUnionChildren(union.id).some((cid) => {
                const child = personMap.get(cid);
                return child && !child.deleted;
            });
        });
    }

    // Subtree width calculation (returns horizontal space required by subtree)
    function calcSubtreeWidth(personId: string, visited: Set<string>): number {
        if (visited.has(personId)) return NODE_WIDTH;
        visited.add(personId);

        const isExpanded = expandedNodeIds.has(personId);
        const myUnions = getPersonUnions(personId);
        if (!isExpanded || myUnions.length === 0) return NODE_WIDTH;

        let totalWidth = 0;
        for (const union of myUnions) {
            const children = getUnionChildren(union.id).filter(cid => {
                const child = personMap.get(cid);
                return child && !child.deleted;
            });

            let unionWidth = COUPLE_WIDTH;
            if (children.length > 0) {
                let childrenWidth = 0;
                for (const childId of children) {
                    if (childrenWidth > 0) childrenWidth += H_GAP;
                    childrenWidth += calcSubtreeWidth(childId, new Set(visited));
                }
                unionWidth = Math.max(childrenWidth, COUPLE_WIDTH);
            }
            if (totalWidth > 0) totalWidth += H_GAP;
            totalWidth += unionWidth;
        }
        return Math.max(totalWidth, NODE_WIDTH);
    }

    function layoutPerson(personId: string, centerX: number, y: number, visited: Set<string>) {
        if (visited.has(personId)) return;
        visited.add(personId);

        const person = personMap.get(personId);
        if (!person || person.deleted) return;

        const isExpanded = expandedNodeIds.has(personId);
        const myUnions = getPersonUnions(personId);

        // Case 1: Simple leaf node or collapsed
        if (!isExpanded || myUnions.length === 0) {
            positioned.set(personId, { x: centerX, y });
            nodes.push({
                id: personId,
                type: 'person',
                position: { x: centerX - NODE_WIDTH / 2, y },
                data: { person, expandable: isExpandable(personId) },
            });
            return;
        }

        // Case 2: Handled for single union (fully symmetric couple center)
        if (myUnions.length === 1) {
            const union = myUnions[0];
            const spouseId = getSpouseId(union, personId);
            const spouseExists = spouseId && personMap.has(spouseId) && !personMap.get(spouseId)!.deleted;

            const children = getUnionChildren(union.id).filter(cid => {
                const child = personMap.get(cid);
                return child && !child.deleted;
            });

            const renderSpouse = Boolean(spouseExists && spouseId && !positioned.has(spouseId));

            // Nothing visible hangs off this union — render as a plain node
            if (!renderSpouse && children.length === 0) {
                positioned.set(personId, { x: centerX, y });
                nodes.push({
                    id: personId,
                    type: 'person',
                    position: { x: centerX - NODE_WIDTH / 2, y },
                    data: { person, expandable: false },
                });
                return;
            }

            let childrenWidth = 0;
            if (children.length > 0) {
                children.forEach((childId, idx) => {
                    if (idx > 0) childrenWidth += H_GAP;
                    childrenWidth += calcSubtreeWidth(childId, new Set());
                });
            }

            // Single Union Couple spacing
            const primaryX = centerX - SPOUSE_GAP / 2;
            const spouseX = centerX + SPOUSE_GAP / 2;
            const unionDotX = centerX;
            const unionNodeY = y + NODE_HEIGHT + 35;
            const unionNodeId = `union-${union.id}`;

            positioned.set(personId, { x: primaryX, y });
            nodes.push({
                id: personId,
                type: 'person',
                position: { x: primaryX - NODE_WIDTH / 2, y },
                data: { person, expandable: true },
            });

            if (renderSpouse && spouseId) {
                positioned.set(spouseId, { x: spouseX, y });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX - NODE_WIDTH / 2, y },
                    data: { person: personMap.get(spouseId)!, expandable: false },
                });

                if (children.length === 0) {
                    edges.push({
                        id: `e-${personId}-${spouseId}`,
                        source: personId,
                        target: spouseId,
                        type: 'straight',
                        style: EDGE_STYLE,
                        sourceHandle: 'right-source',
                        targetHandle: 'left-target',
                    });
                    return;
                }

                edges.push({
                    id: `e-${spouseId}-${unionNodeId}`,
                    source: spouseId,
                    target: unionNodeId,
                    type: 'smoothstep',
                    style: EDGE_STYLE,
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                });
            }

            nodes.push({
                id: unionNodeId,
                type: 'union',
                position: { x: unionDotX - UNION_NODE_SIZE / 2, y: unionNodeY },
                data: { union, hasChildren: children.length > 0 },
            });

            edges.push({
                id: `e-${personId}-${unionNodeId}`,
                source: personId,
                target: unionNodeId,
                type: 'smoothstep',
                style: EDGE_STYLE,
                sourceHandle: 'bottom',
                targetHandle: 'top',
            });

            if (children.length > 0) {
                const childY = unionNodeY + UNION_NODE_SIZE + V_GAP;
                let childStartX = unionDotX - childrenWidth / 2;

                children.forEach((childId) => {
                    const childWidth = calcSubtreeWidth(childId, new Set());
                    const childCenterX = childStartX + childWidth / 2;

                    edges.push({
                        id: `e-${unionNodeId}-${childId}`,
                        source: unionNodeId,
                        target: childId,
                        type: 'smoothstep',
                        style: EDGE_STYLE,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                    });

                    layoutPerson(childId, childCenterX, childY, visited);
                    childStartX += childWidth + H_GAP;
                });
            }
            return;
        }

        // Case 3: Multiple Unions (Primary person centered at centerX)
        positioned.set(personId, { x: centerX, y });
        nodes.push({
            id: personId,
            type: 'person',
            position: { x: centerX - NODE_WIDTH / 2, y },
            data: { person, expandable: true },
        });

        const leftCount = Math.ceil(myUnions.length / 2);
        const leftUnions = myUnions.slice(0, leftCount);
        const rightUnions = myUnions.slice(leftCount);

        // Layout left unions (from rightmost near center to leftmost)
        let limitLeft = centerX - H_GAP / 2;
        leftUnions.forEach((union) => {
            if (processedUnions.has(union.id)) return;
            processedUnions.add(union.id);

            const spouseId = getSpouseId(union, personId);
            const spouseExists = spouseId && personMap.has(spouseId) && !personMap.get(spouseId)!.deleted;

            const children = getUnionChildren(union.id).filter(cid => {
                const child = personMap.get(cid);
                return child && !child.deleted && !visited.has(cid);
            });

            const renderSpouse = Boolean(spouseExists && spouseId && !positioned.has(spouseId));
            // Skip unions with nothing visible to connect (avoids orphan edge stubs)
            if (!renderSpouse && children.length === 0) return;

            let childrenWidth = 0;
            if (children.length > 0) {
                children.forEach((childId, idx) => {
                    if (idx > 0) childrenWidth += H_GAP;
                    childrenWidth += calcSubtreeWidth(childId, new Set());
                });
            }

            // UnionDotX needs to respect subtree boundary and spouse spacing
            const unionDotX = Math.min(centerX - SPOUSE_GAP / 2, limitLeft - childrenWidth / 2);
            const spouseX = 2 * unionDotX - centerX;
            const unionNodeY = y + NODE_HEIGHT + 35;
            const unionNodeId = `union-${union.id}`;

            if (children.length === 0 && renderSpouse && spouseId) {
                positioned.set(spouseId, { x: spouseX, y });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX - NODE_WIDTH / 2, y },
                    data: { person: personMap.get(spouseId)!, expandable: false },
                });
                edges.push({
                    id: `e-${personId}-${spouseId}`,
                    source: personId,
                    target: spouseId,
                    type: 'straight',
                    style: EDGE_STYLE,
                    sourceHandle: 'left-source',
                    targetHandle: 'right-target',
                });
                limitLeft = spouseX - NODE_WIDTH / 2 - H_GAP;
                return;
            }

            nodes.push({
                id: unionNodeId,
                type: 'union',
                position: { x: unionDotX - UNION_NODE_SIZE / 2, y: unionNodeY },
                data: { union, hasChildren: children.length > 0 },
            });

            edges.push({
                id: `e-${personId}-${unionNodeId}`,
                source: personId,
                target: unionNodeId,
                type: 'smoothstep',
                style: EDGE_STYLE,
                sourceHandle: 'bottom',
                targetHandle: 'top',
            });

            if (renderSpouse && spouseId) {
                positioned.set(spouseId, { x: spouseX, y });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX - NODE_WIDTH / 2, y },
                    data: { person: personMap.get(spouseId)!, expandable: false },
                });

                edges.push({
                    id: `e-${spouseId}-${unionNodeId}`,
                    source: spouseId,
                    target: unionNodeId,
                    type: 'smoothstep',
                    style: EDGE_STYLE,
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                });
            }

            if (children.length > 0) {
                const childY = unionNodeY + UNION_NODE_SIZE + V_GAP;
                let childStartX = unionDotX - childrenWidth / 2;

                children.forEach((childId) => {
                    const childWidth = calcSubtreeWidth(childId, new Set());
                    const childCenterX = childStartX + childWidth / 2;

                    edges.push({
                        id: `e-${unionNodeId}-${childId}`,
                        source: unionNodeId,
                        target: childId,
                        type: 'smoothstep',
                        style: EDGE_STYLE,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                    });

                    layoutPerson(childId, childCenterX, childY, visited);
                    childStartX += childWidth + H_GAP;
                });
            }

            // Keep track of left boundary for this union block
            const leftmostX = Math.min(unionDotX - childrenWidth / 2, spouseX - NODE_WIDTH / 2);
            limitLeft = leftmostX - H_GAP;
        });

        // Layout right unions (from leftmost near center to rightmost)
        let limitRight = centerX + H_GAP / 2;
        rightUnions.forEach((union) => {
            if (processedUnions.has(union.id)) return;
            processedUnions.add(union.id);

            const spouseId = getSpouseId(union, personId);
            const spouseExists = spouseId && personMap.has(spouseId) && !personMap.get(spouseId)!.deleted;

            const children = getUnionChildren(union.id).filter(cid => {
                const child = personMap.get(cid);
                return child && !child.deleted && !visited.has(cid);
            });

            const renderSpouse = Boolean(spouseExists && spouseId && !positioned.has(spouseId));
            // Skip unions with nothing visible to connect (avoids orphan edge stubs)
            if (!renderSpouse && children.length === 0) return;

            let childrenWidth = 0;
            if (children.length > 0) {
                children.forEach((childId, idx) => {
                    if (idx > 0) childrenWidth += H_GAP;
                    childrenWidth += calcSubtreeWidth(childId, new Set());
                });
            }

            const unionDotX = Math.max(centerX + SPOUSE_GAP / 2, limitRight + childrenWidth / 2);
            const spouseX = 2 * unionDotX - centerX;
            const unionNodeY = y + NODE_HEIGHT + 35;
            const unionNodeId = `union-${union.id}`;

            if (children.length === 0 && renderSpouse && spouseId) {
                positioned.set(spouseId, { x: spouseX, y });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX - NODE_WIDTH / 2, y },
                    data: { person: personMap.get(spouseId)!, expandable: false },
                });
                edges.push({
                    id: `e-${personId}-${spouseId}`,
                    source: personId,
                    target: spouseId,
                    type: 'straight',
                    style: EDGE_STYLE,
                    sourceHandle: 'right-source',
                    targetHandle: 'left-target',
                });
                limitRight = spouseX + NODE_WIDTH / 2 + H_GAP;
                return;
            }

            nodes.push({
                id: unionNodeId,
                type: 'union',
                position: { x: unionDotX - UNION_NODE_SIZE / 2, y: unionNodeY },
                data: { union, hasChildren: children.length > 0 },
            });

            edges.push({
                id: `e-${personId}-${unionNodeId}`,
                source: personId,
                target: unionNodeId,
                type: 'smoothstep',
                style: EDGE_STYLE,
                sourceHandle: 'bottom',
                targetHandle: 'top',
            });

            if (renderSpouse && spouseId) {
                positioned.set(spouseId, { x: spouseX, y });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX - NODE_WIDTH / 2, y },
                    data: { person: personMap.get(spouseId)!, expandable: false },
                });

                edges.push({
                    id: `e-${spouseId}-${unionNodeId}`,
                    source: spouseId,
                    target: unionNodeId,
                    type: 'smoothstep',
                    style: EDGE_STYLE,
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                });
            }

            if (children.length > 0) {
                const childY = unionNodeY + UNION_NODE_SIZE + V_GAP;
                let childStartX = unionDotX - childrenWidth / 2;

                children.forEach((childId) => {
                    const childWidth = calcSubtreeWidth(childId, new Set());
                    const childCenterX = childStartX + childWidth / 2;

                    edges.push({
                        id: `e-${unionNodeId}-${childId}`,
                        source: unionNodeId,
                        target: childId,
                        type: 'smoothstep',
                        style: EDGE_STYLE,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                    });

                    layoutPerson(childId, childCenterX, childY, visited);
                    childStartX += childWidth + H_GAP;
                });
            }

            const rightmostX = Math.max(unionDotX + childrenWidth / 2, spouseX + NODE_WIDTH / 2);
            limitRight = rightmostX + H_GAP;
        });
    }

    const visited = new Set<string>();
    layoutPerson(rootPersonId, 0, 0, visited);

    return { nodes, edges };
}
