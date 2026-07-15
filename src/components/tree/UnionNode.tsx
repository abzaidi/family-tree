'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function UnionNodeComponent({ }: NodeProps) {
    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-2 !h-1 !bg-transparent !border-0 !min-h-0" id="top" />
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 border-2 border-white shadow-md" />
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-1 !bg-transparent !border-0 !min-h-0" id="bottom" />
        </>
    );
}

export const UnionNode = memo(UnionNodeComponent);
