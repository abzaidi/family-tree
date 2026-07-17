'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Plus, Minus, User, Heart } from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';
import type { Person } from '@/types';

interface PersonNodeData {
    person: Person;
    expandable?: boolean;
    [key: string]: unknown;
}

function PersonNodeComponent({ data, id }: NodeProps) {
    const nodeData = data as unknown as PersonNodeData;
    const person = nodeData.person;
    const { expandedNodeIds, toggleNode, selectPerson } = useTreeStore();
    const { getPersonName, locale } = useI18n();
    const isExpanded = expandedNodeIds.has(id);

    // Set by the layout engine only on nodes whose expansion actually reveals
    // something (spouse nodes and dead-end nodes get no toggle)
    const expandable = Boolean(nodeData.expandable);

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
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-1 !bg-transparent !border-0 !min-h-0 !pointer-events-none"
                id="top"
            />
            <Handle
                type="source"
                position={Position.Left}
                className="!w-1 !h-3 !bg-transparent !border-0 !min-w-0 !pointer-events-none"
                id="left-source"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!w-1 !h-3 !bg-transparent !border-0 !min-w-0 !pointer-events-none"
                id="left-target"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-1 !h-3 !bg-transparent !border-0 !min-w-0 !pointer-events-none"
                id="right-source"
            />
            <Handle
                type="target"
                position={Position.Right}
                className="!w-1 !h-3 !bg-transparent !border-0 !min-w-0 !pointer-events-none"
                id="right-target"
            />
            <motion.div
                className={`
                    relative cursor-pointer select-none
                    rounded-2xl border-2 bg-card shadow-lg
                    transition-colors duration-200
                    w-[260px] h-[110px]
                    ${isFemale
                        ? 'border-pink-200 hover:border-pink-400 hover:shadow-pink-100 dark:border-pink-800 dark:hover:border-pink-500 dark:hover:shadow-pink-950/40'
                        : 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100 dark:border-blue-800 dark:hover:border-blue-500 dark:hover:shadow-blue-950/40'
                    }
                `}
                whileHover={{ scale: 1.03, y: -2 }}
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

                <div className="px-4 py-3 overflow-hidden">
                    {/* Gender icon and Name */}
                    <div className="flex items-start gap-2.5 mb-1">
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isFemale
                                ? 'bg-pink-50 text-pink-500 dark:bg-pink-950/60 dark:text-pink-300'
                                : 'bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                                }`}
                        >
                            {isFemale ? (
                                <Heart className="w-4 h-4" />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                        </div>
                        <span
                            className={`min-w-0 flex-1 line-clamp-2 font-semibold text-[15px] text-foreground leading-snug break-words ${locale === 'ur' ? 'font-urdu' : ''
                                }`}
                            dir={locale === 'ur' ? 'rtl' : 'ltr'}
                            style={{ wordBreak: 'break-word' }}
                        >
                            {displayName}
                        </span>
                    </div>

                    {/* Year range */}
                    {yearRange && (
                        <p className="text-xs text-muted-foreground mt-1.5 pl-10">{yearRange}</p>
                    )}
                </div>

                {/* Expand/Collapse button */}
                {expandable && (
                    <button
                        onClick={handleExpandToggle}
                        className={`
                            absolute -bottom-3.5 left-1/2 -translate-x-1/2
                            w-7 h-7 rounded-full border-2 bg-card
                            flex items-center justify-center
                            transition-colors z-10 shadow-sm
                            ${isFemale
                                ? 'border-pink-300 text-pink-500 hover:bg-pink-50 dark:border-pink-700 dark:text-pink-300 dark:hover:bg-pink-950/50'
                                : 'border-blue-300 text-blue-500 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/50'
                            }
                        `}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? (
                            <Minus className="w-4 h-4" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                    </button>
                )}
            </motion.div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-1 !bg-transparent !border-0 !min-h-0 !pointer-events-none"
                id="bottom"
            />
        </>
    );
}

export const PersonNode = memo(PersonNodeComponent);
