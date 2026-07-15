'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, User, Heart } from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';
import type { Person } from '@/types';

interface PersonNodeData {
    person: Person;
    [key: string]: unknown;
}

function PersonNodeComponent({ data, id }: NodeProps) {
    const nodeData = data as unknown as PersonNodeData;
    const person = nodeData.person;
    const { expandedNodeIds, toggleNode, selectPerson, unions, unionChildren } = useTreeStore();
    const { getPersonName, locale } = useI18n();
    const isExpanded = expandedNodeIds.has(id);

    // Check if this person has children (through any union)
    const hasChildren = unions.some((u) => {
        if (u.partner1_id !== id && u.partner2_id !== id) return false;
        return unionChildren.some((uc) => uc.union_id === u.id);
    });

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            selectPerson(id);
        },
        [id, selectPerson]
    );

    const handleExpandToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            toggleNode(id);
        },
        [id, toggleNode]
    );

    const displayName = getPersonName(person.english_name, person.urdu_name);
    const isFemale = person.gender === 'female';
    const yearRange =
        person.birth_year || person.death_year
            ? `${person.birth_year || '?'} — ${person.death_year || ''}`
            : null;

    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-3 !h-1 !bg-transparent !border-0 !min-h-0" id="top" />
            <motion.div
                className={`
          relative cursor-pointer select-none
          rounded-2xl border-2 bg-white shadow-lg
          transition-colors duration-200
          min-w-[180px] max-w-[220px]
          ${isFemale
                        ? 'border-pink-200 hover:border-pink-400 hover:shadow-pink-100'
                        : 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100'
                    }
        `}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClick}
                layout
            >
                {/* Top accent bar */}
                <div
                    className={`h-1.5 rounded-t-2xl ${isFemale
                            ? 'bg-gradient-to-r from-pink-400 to-rose-400'
                            : 'bg-gradient-to-r from-blue-400 to-indigo-400'
                        }`}
                />

                <div className="px-4 py-3">
                    {/* Gender icon and Name */}
                    <div className="flex items-center gap-2 mb-1">
                        <div
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isFemale ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
                                }`}
                        >
                            {isFemale ? (
                                <Heart className="w-3.5 h-3.5" />
                            ) : (
                                <User className="w-3.5 h-3.5" />
                            )}
                        </div>
                        <span
                            className={`font-semibold text-sm text-gray-800 leading-tight truncate ${locale === 'ur' ? 'font-urdu' : ''
                                }`}
                            dir={locale === 'ur' ? 'rtl' : 'ltr'}
                        >
                            {displayName}
                        </span>
                    </div>

                    {/* Year range */}
                    {yearRange && (
                        <p className="text-xs text-gray-400 mt-1 pl-9">{yearRange}</p>
                    )}
                </div>

                {/* Expand/Collapse button */}
                {hasChildren && (
                    <button
                        onClick={handleExpandToggle}
                        className={`
              absolute -bottom-3 left-1/2 -translate-x-1/2
              w-6 h-6 rounded-full border-2 bg-white
              flex items-center justify-center
              transition-colors z-10 shadow-sm
              ${isFemale
                                ? 'border-pink-300 text-pink-500 hover:bg-pink-50'
                                : 'border-blue-300 text-blue-500 hover:bg-blue-50'
                            }
            `}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}
            </motion.div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-1 !bg-transparent !border-0 !min-h-0" id="bottom" />
        </>
    );
}

export const PersonNode = memo(PersonNodeComponent);
