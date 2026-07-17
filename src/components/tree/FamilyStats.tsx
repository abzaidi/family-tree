'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';

export function FamilyStats() {
    const persons = useTreeStore((state) => state.persons);
    const { t } = useI18n();

    const stats = useMemo(() => {
        const active = persons.filter((person) => !person.deleted);
        return {
            total: active.length,
            males: active.filter((person) => person.gender === 'male').length,
            females: active.filter((person) => person.gender === 'female').length,
        };
    }, [persons]);

    if (stats.total === 0) return null;

    return (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">
            <div className="pointer-events-auto rounded-xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {t('stats.title')}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-base font-semibold tabular-nums leading-none">
                            {stats.total}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {t('stats.total')}
                        </p>
                    </div>
                    <div>
                        <p className="text-base font-semibold tabular-nums leading-none text-blue-600 dark:text-blue-400">
                            {stats.males}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {t('stats.males')}
                        </p>
                    </div>
                    <div>
                        <p className="text-base font-semibold tabular-nums leading-none text-pink-600 dark:text-pink-400">
                            {stats.females}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {t('stats.females')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
