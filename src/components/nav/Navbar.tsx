'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Search,
    ChevronsDownUp,
    ChevronsUpDown,
    TreePine,
} from 'lucide-react';
import { LanguageSwitch } from './LanguageSwitch';
import { UserMenu } from './UserMenu';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';

export function Navbar() {
    const { setSearchOpen, expandAll, collapseAll } = useTreeStore();
    const { t } = useI18n();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                        <TreePine className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-base text-gray-800 tracking-tight">
                        {t('app.title')}
                    </span>
                </div>

                {/* Center: Search */}
                <button
                    onClick={() => setSearchOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-gray-100 transition-colors text-sm text-gray-400 min-w-[240px]"
                    aria-label={t('nav.search')}
                >
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">{t('nav.search')}</span>
                    <kbd className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-400">
                        ⌘K
                    </kbd>
                </button>

                {/* Right: Controls */}
                <div className="flex items-center gap-1">
                    {/* Search (mobile) */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="sm:hidden"
                        onClick={() => setSearchOpen(true)}
                        aria-label={t('nav.search')}
                    >
                        <Search className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={expandAll}
                        aria-label={t('nav.expandAll')}
                        title={t('nav.expandAll')}
                    >
                        <ChevronsUpDown className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={collapseAll}
                        aria-label={t('nav.collapseAll')}
                        title={t('nav.collapseAll')}
                    >
                        <ChevronsDownUp className="w-4 h-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <LanguageSwitch />
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}
