import type { Person, Union, UnionChild } from '@/types';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const UNION_NODE_SIZE = 24;
const H_GAP = 60;
const V_GAP = 120;
const SPOUSE_GAP = 240;

export interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

interface PositionedPerson {
    personId: string;
    x: number;
    y: number;
}

export function buildTreeLayout(
    persons: Person[],
    unions: Union[],
    unionChildren: UnionChild[],
    rootPersonId: string | null,
    expandedNodeIds: Set<string>
): LayoutResult {
    if (!rootPersonId || persons.length === 0) {
        return { nodes: [], edges: [] };
    }

    const personMap = new Map<string, Person>();
    persons.forEach((p) => personMap.set(p.id, p));

    if (!personMap.has(rootPersonId)) {
        return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const positioned = new Map<string, { x: number; y: number }>();
    const processedUnions = new Set<string>();

    function getPersonUnions(personId: string): Union[] {
        return unions.filter(
            (u) => u.partner1_id === personId || u.partner2_id === personId
        );
    }

    function getUnionChildren(unionId: string): string[] {
        return unionChildren
            .filter((uc) => uc.union_id === unionId)
            .map((uc) => uc.child_id);
    }

    function getSpouseId(union: Union, personId: string): string | null {
        if (union.partner1_id === personId) return union.partner2_id;
        if (union.partner2_id === personId) return union.partner1_id;
        return null;
    }

    // Calculate width of a subtree rooted at a person
    function calcSubtreeWidth(personId: string, depth: number, visited: Set<string>): number {
        if (visited.has(personId)) return NODE_WIDTH;
        visited.add(personId);

        const isExpanded = expandedNodeIds.has(personId);
        const myUnions = getPersonUnions(personId);

        if (!isExpanded || myUnions.length === 0) {
            return NODE_WIDTH;
        }

        let totalWidth = 0;

        for (const union of myUnions) {
            const spouseId = getSpouseId(union, personId);
            const childIds = getUnionChildren(union.id);
            const activeChildren = childIds.filter((cid) => {
                const child = personMap.get(cid);
                return child && !child.deleted;
            });

            // Width from this union's children
            if (activeChildren.length > 0) {
                let childrenWidth = 0;
                for (const childId of activeChildren) {
                    childrenWidth += calcSubtreeWidth(childId, depth + 1, new Set(visited));
                    childrenWidth += H_GAP;
                }
                childrenWidth -= H_GAP; // Remove last gap
                totalWidth += Math.max(childrenWidth, SPOUSE_GAP);
            } else {
                totalWidth += SPOUSE_GAP;
            }
            totalWidth += H_GAP;
        }
        totalWidth -= H_GAP;

        return Math.max(totalWidth, NODE_WIDTH);
    }

    // Recursively place person and their family
    function layoutPerson(
        personId: string,
        x: number,
        y: number,
        visited: Set<string>
    ) {
        if (visited.has(personId)) return;
        visited.add(personId);

        const person = personMap.get(personId);
        if (!person || person.deleted) return;

        // Place person node
        positioned.set(personId, { x, y });
        nodes.push({
            id: personId,
            type: 'person',
            position: { x, y },
            data: { person },
        });

        const isExpanded = expandedNodeIds.has(personId);
        const myUnions = getPersonUnions(personId);

        if (!isExpanded || myUnions.length === 0) return;

        // Group unions for this person
        let currentX = x;

        // Calculate total width needed for all unions
        const unionWidths: number[] = [];
        for (const union of myUnions) {
            const childIds = getUnionChildren(union.id);
            const activeChildren = childIds.filter((cid) => {
                const child = personMap.get(cid);
                return child && !child.deleted;
            });

            let w = SPOUSE_GAP;
            if (activeChildren.length > 0) {
                let childrenWidth = 0;
                for (const childId of activeChildren) {
                    childrenWidth += calcSubtreeWidth(childId, 0, new Set());
                    childrenWidth += H_GAP;
                }
                childrenWidth -= H_GAP;
                w = Math.max(childrenWidth, SPOUSE_GAP);
            }
            unionWidths.push(w);
        }

        const totalWidth = unionWidths.reduce((a, b) => a + b + H_GAP, -H_GAP);
        let startX = x - totalWidth / 2 + NODE_WIDTH / 2;

        for (let i = 0; i < myUnions.length; i++) {
            const union = myUnions[i];
            if (processedUnions.has(union.id)) continue;
            processedUnions.add(union.id);

            const unionWidth = unionWidths[i];
            const unionCenterX = startX + unionWidth / 2 - NODE_WIDTH / 2;

            const spouseId = getSpouseId(union, personId);
            const spouseExists = spouseId && personMap.has(spouseId) && !personMap.get(spouseId)!.deleted;

            // Union connector node
            const unionNodeX = unionCenterX;
            const unionNodeY = y + NODE_HEIGHT + 20;
            const unionNodeId = `union-${union.id}`;

            nodes.push({
                id: unionNodeId,
                type: 'union',
                position: { x: unionNodeX + NODE_WIDTH / 2 - UNION_NODE_SIZE / 2, y: unionNodeY },
                data: { union },
            });

            // Edge from person to union node
            edges.push({
                id: `e-${personId}-${unionNodeId}`,
                source: personId,
                target: unionNodeId,
                type: 'smoothstep',
                style: { stroke: '#94a3b8', strokeWidth: 2 },
                sourceHandle: 'bottom',
                targetHandle: 'top',
            });

            // Place spouse
            if (spouseExists && spouseId && !positioned.has(spouseId)) {
                const spouseX = unionCenterX + SPOUSE_GAP / 2 + NODE_WIDTH / 2;
                const spouseY = y;

                positioned.set(spouseId, { x: spouseX, y: spouseY });
                nodes.push({
                    id: spouseId,
                    type: 'person',
                    position: { x: spouseX, y: spouseY },
                    data: { person: personMap.get(spouseId)! },
                });

                // Edge from spouse to union node
                edges.push({
                    id: `e-${spouseId}-${unionNodeId}`,
                    source: spouseId,
                    target: unionNodeId,
                    type: 'smoothstep',
                    style: { stroke: '#f472b6', strokeWidth: 2, strokeDasharray: '6 3' },
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                });

                // Move the person node to left of center
                const personNode = nodes.find((n) => n.id === personId);
                if (personNode && myUnions.length === 1) {
                    const personX = unionCenterX - SPOUSE_GAP / 2 - NODE_WIDTH / 2 + NODE_WIDTH;
                    personNode.position.x = personX;
                    positioned.set(personId, { x: personX, y });
                }
            }

            // Place children
            const childIds = getUnionChildren(union.id);
            const activeChildren = childIds.filter((cid) => {
                const child = personMap.get(cid);
                return child && !child.deleted && !visited.has(cid);
            });

            if (activeChildren.length > 0) {
                const childrenTotalWidth = activeChildren.reduce((acc, childId) => {
                    return acc + calcSubtreeWidth(childId, 0, new Set()) + H_GAP;
                }, -H_GAP);

                let childX = unionCenterX + NODE_WIDTH / 2 - childrenTotalWidth / 2;
                const childY = unionNodeY + UNION_NODE_SIZE + V_GAP;

                for (const childId of activeChildren) {
                    const childWidth = calcSubtreeWidth(childId, 0, new Set());

                    // Edge from union node to child
                    edges.push({
                        id: `e-${unionNodeId}-${childId}`,
                        source: unionNodeId,
                        target: childId,
                        type: 'smoothstep',
                        style: { stroke: '#94a3b8', strokeWidth: 2 },
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                    });

                    layoutPerson(childId, childX + childWidth / 2 - NODE_WIDTH / 2, childY, visited);
                    childX += childWidth + H_GAP;
                }
            }

            startX += unionWidth + H_GAP;
        }
    }

    const visited = new Set<string>();
    layoutPerson(rootPersonId, 0, 0, visited);

    return { nodes, edges };
}
