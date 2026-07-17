'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function UnionNodeComponent({ data }: NodeProps) {
    const hasChildren = Boolean((data as { hasChildren?: boolean }).hasChildren);
    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-2 !h-1 !bg-transparent !border-0 !min-h-0" id="top" />
            {/* Bridge the gap between incoming parent edges and the outgoing child edge */}
            <div className="relative w-6 h-6" aria-hidden="true">
                {hasChildren && (
                    <div className="absolute -top-1 -bottom-1 left-1/2 w-[2px] -translate-x-1/2 bg-[#94a3b8]" />
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-1 !bg-transparent !border-0 !min-h-0" id="bottom" />
        </>
    );
}

export const UnionNode = memo(UnionNodeComponent);
