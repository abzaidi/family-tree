'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useReactFlow,
    type NodeTypes,
    BackgroundVariant,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PersonNode } from './PersonNode';
import { UnionNode } from './UnionNode';
import { useTreeStore } from '@/store/tree-store';
import { buildTreeLayout } from '@/lib/tree/layout-engine';

const nodeTypes: NodeTypes = {
    person: PersonNode,
    union: UnionNode,
};

function FamilyCanvasInner() {
    const { fitView, setCenter } = useReactFlow();
    const {
        persons,
        unions,
        unionChildren,
        rootPersonId,
        expandedNodeIds,
    } = useTreeStore();
    const initialFitDone = useRef(false);
    const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

    const activePersons = useMemo(
        () => persons.filter((p) => !p.deleted),
        [persons]
    );

    const { nodes, edges } = useMemo(
        () =>
            buildTreeLayout(
                activePersons,
                unions,
                unionChildren,
                rootPersonId,
                expandedNodeIds
            ),
        [activePersons, unions, unionChildren, rootPersonId, expandedNodeIds]
    );

    useEffect(() => {
        if (nodes.length > 0 && !initialFitDone.current) {
            setTimeout(() => {
                fitView({ padding: 0.3, duration: 600 });
                initialFitDone.current = true;
            }, 100);
        }
    }, [nodes.length, fitView]);

    useEffect(() => {
        const handleFocusPerson = (event: Event) => {
            setFocusPersonId((event as CustomEvent<string>).detail);
        };

        window.addEventListener('focus-person', handleFocusPerson);
        return () => window.removeEventListener('focus-person', handleFocusPerson);
    }, []);

    useEffect(() => {
        if (!focusPersonId) return;

        const personNode = nodes.find((node) => node.id === focusPersonId);
        if (!personNode) return;

        const timeout = window.setTimeout(() => {
            setCenter(
                personNode.position.x + 130,
                personNode.position.y + 55,
                { zoom: 1.1, duration: 600 }
            );
            setFocusPersonId(null);
        }, 75);

        return () => window.clearTimeout(timeout);
    }, [focusPersonId, nodes, setCenter]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.1}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="bg-muted/40"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnDrag
                zoomOnScroll
                zoomOnPinch
                zoomOnDoubleClick
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="var(--tree-dot)"
                />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}

export default function FamilyCanvas() {
    return (
        <ReactFlowProvider>
            <FamilyCanvasInner />
        </ReactFlowProvider>
    );
}
