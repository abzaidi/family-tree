'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { User, Heart } from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';

export function SearchCommand() {
    const {
        isSearchOpen,
        setSearchOpen,
        persons,
        unions,
        unionChildren,
        rootPersonId,
        expandNodes,
    } =
        useTreeStore();
    const { t, getPersonName } = useI18n();
    const [query, setQuery] = useState('');

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(!isSearchOpen);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, setSearchOpen]);

    const activePersons = useMemo(
        () => persons.filter((p) => !p.deleted),
        [persons]
    );

    const filtered = useMemo(() => {
        if (!query.trim()) return activePersons.slice(0, 20);
        const q = query.toLowerCase();
        return activePersons.filter(
            (p) =>
                p.english_name.toLowerCase().includes(q) ||
                p.urdu_name.includes(query) // Urdu is case-sensitive
        );
    }, [query, activePersons]);

    const handleSelect = useCallback(
        (personId: string) => {
            const findExpansionPath = (): string[] => {
                if (!rootPersonId || rootPersonId === personId) return [];

                const queue: Array<{ id: string; path: string[] }> = [
                    { id: rootPersonId, path: [] },
                ];
                const visited = new Set<string>();

                while (queue.length > 0) {
                    const current = queue.shift()!;
                    if (visited.has(current.id)) continue;
                    visited.add(current.id);

                    const nextPath = [...current.path, current.id];
                    const personUnions = unions.filter(
                        (union) =>
                            union.partner1_id === current.id ||
                            union.partner2_id === current.id
                    );

                    for (const union of personUnions) {
                        const spouseId =
                            union.partner1_id === current.id
                                ? union.partner2_id
                                : union.partner1_id;
                        if (spouseId === personId) return nextPath;

                        const childIds = unionChildren
                            .filter((child) => child.union_id === union.id)
                            .map((child) => child.child_id);

                        for (const childId of childIds) {
                            if (childId === personId) return nextPath;
                            if (!visited.has(childId)) {
                                queue.push({ id: childId, path: nextPath });
                            }
                        }
                    }
                }

                return [];
            };

            expandNodes([...findExpansionPath(), personId]);
            setSearchOpen(false);
            setQuery('');
            window.dispatchEvent(
                new CustomEvent<string>('focus-person', { detail: personId })
            );
        },
        [
            rootPersonId,
            unions,
            unionChildren,
            expandNodes,
            setSearchOpen,
        ]
    );

    return (
        <CommandDialog
            open={isSearchOpen}
            onOpenChange={setSearchOpen}
        >
            <CommandInput
                placeholder={t('search.placeholder')}
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>{t('search.noResults')}</CommandEmpty>
                <CommandGroup heading={t('search.title')}>
                    {filtered.map((person) => (
                        <CommandItem
                            key={person.id}
                            value={`${person.english_name} ${person.urdu_name}`}
                            onSelect={() => handleSelect(person.id)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center gap-3 w-full">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${person.gender === 'female'
                                            ? 'bg-pink-50 text-pink-500 dark:bg-pink-950/60 dark:text-pink-300'
                                            : 'bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                                        }`}
                                >
                                    {person.gender === 'female' ? (
                                        <Heart className="w-3.5 h-3.5" />
                                    ) : (
                                        <User className="w-3.5 h-3.5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {getPersonName(person.english_name, person.urdu_name)}
                                    </p>
                                    {person.birth_year && (
                                        <p className="text-xs text-muted-foreground">
                                            {person.birth_year}
                                            {person.death_year ? ` — ${person.death_year}` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
