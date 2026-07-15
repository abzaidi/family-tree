'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
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
    const { fitView } = useReactFlow();
    const {
        persons,
        unions,
        unionChildren,
        rootPersonId,
        expandedNodeIds,
    } = useTreeStore();
    const initialFitDone = useRef(false);

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

    // Re-fit when the tree layout changes (expand/collapse)
    useEffect(() => {
        if (initialFitDone.current && nodes.length > 0) {
            setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 50);
        }
    }, [expandedNodeIds, fitView, nodes.length]);

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
                className="bg-gray-50/50"
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
                    color="#e2e8f0"
                />
                <Controls
                    showInteractive={false}
                    className="!bg-white !border !border-gray-200 !rounded-xl !shadow-lg"
                />
                <MiniMap
                    className="!bg-white !border !border-gray-200 !rounded-xl !shadow-lg"
                    maskColor="rgba(0, 0, 0, 0.08)"
                    nodeColor={(node) => {
                        if (node.type === 'union') return '#d8b4fe';
                        const person = (node.data as { person?: { gender?: string } })?.person;
                        return person?.gender === 'female' ? '#fbb6ce' : '#93c5fd';
                    }}
                    pannable
                    zoomable
                />
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
