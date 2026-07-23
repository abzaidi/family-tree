'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Search,
    ChevronsDownUp,
    ChevronsUpDown,
    TreePine,
    UserRoundPlus,
    Info,
    ChevronRight,
} from 'lucide-react';
import { LanguageSwitch } from './LanguageSwitch';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AboutMovementSheet } from '@/components/panels/AboutMovementSheet';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';

interface NavbarProps {
    canEdit: boolean;
    onInsertPerson: () => void;
}

export function Navbar({ canEdit, onInsertPerson }: NavbarProps) {
    const { setSearchOpen, expandAll, collapseAll } = useTreeStore();
    const { t, locale } = useI18n();
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-sm">
                {/* Always-visible movement attribution */}
                <button
                    type="button"
                    onClick={() => setAboutOpen(true)}
                    className="group flex h-8 w-full items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-3 text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset"
                    aria-label={t('about.banner')}
                    title={t('about.bannerHint')}
                >
                    <span
                        className={`truncate text-[11px] sm:text-xs font-medium tracking-wide ${
                            locale === 'ur' ? 'font-urdu' : ''
                        }`}
                    >
                        {t('about.banner')}
                    </span>
                    <ChevronRight className="hidden sm:block h-3.5 w-3.5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </button>

                <nav className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
                    <div className="flex h-14 items-center justify-between px-4">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                                <TreePine className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-bold tracking-tight text-foreground">
                                {t('app.title')}
                            </span>
                        </div>

                        {/* Center: Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="hidden sm:flex min-w-[280px] items-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:min-w-[320px] lg:min-w-[400px]"
                            aria-label={t('nav.search')}
                        >
                            <Search className="h-4 w-4" />
                            <span className="flex-1 text-left">
                                {t('nav.search')}
                            </span>
                            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAboutOpen(true)}
                                aria-label={t('about.nav')}
                                title={t('about.nav')}
                                className="gap-1.5"
                            >
                                <Info className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    {t('about.nav')}
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="sm:hidden"
                                onClick={() => setSearchOpen(true)}
                                aria-label={t('nav.search')}
                            >
                                <Search className="h-4 w-4" />
                            </Button>

                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onInsertPerson}
                                    aria-label={t('action.insertMiddle')}
                                    title={t('action.insertMiddle')}
                                    className="gap-1.5"
                                >
                                    <UserRoundPlus className="h-4 w-4" />
                                    <span className="hidden xl:inline">
                                        {t('action.insertMiddle')}
                                    </span>
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={expandAll}
                                aria-label={t('nav.expandAll')}
                                title={t('nav.expandAll')}
                            >
                                <ChevronsUpDown className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={collapseAll}
                                aria-label={t('nav.collapseAll')}
                                title={t('nav.collapseAll')}
                            >
                                <ChevronsDownUp className="h-4 w-4" />
                            </Button>

                            <Separator
                                orientation="vertical"
                                className="mx-1 h-6"
                            />
                            <ThemeToggle />
                            <LanguageSwitch />
                            <UserMenu />
                        </div>
                    </div>
                </nav>
            </header>

            <AboutMovementSheet open={aboutOpen} onOpenChange={setAboutOpen} />
        </>
    );
}
