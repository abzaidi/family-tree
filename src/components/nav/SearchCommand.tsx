'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Heart, Search, User, X } from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/hooks/useAuth';
import { formatSerialNumber } from '@/lib/person/format';
import {
    EMPTY_PERSON_SEARCH_FILTERS,
    SEARCH_PAGE_SIZE,
    filterPersons,
    getCityOptions,
    getCountryOptions,
    getStateOptions,
    hasActiveSearchFilters,
    type PersonSearchFilters,
} from '@/lib/person/search';
import type { Gender } from '@/types';

const ANY_VALUE = '__any__';

export function SearchCommand() {
    const {
        isSearchOpen,
        setSearchOpen,
        persons,
        unions,
        unionChildren,
        rootPersonId,
        expandNodes,
    } = useTreeStore();
    const { t, getPersonName, locale } = useI18n();
    const { canEdit } = useAuth();

    const [filters, setFilters] = useState<PersonSearchFilters>(
        EMPTY_PERSON_SEARCH_FILTERS
    );
    const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(!useTreeStore.getState().isSearchOpen);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [setSearchOpen]);

    const activePersons = useMemo(
        () => persons.filter((p) => !p.deleted),
        [persons]
    );

    const countryOptions = useMemo(
        () => getCountryOptions(activePersons),
        [activePersons]
    );
    const stateOptions = useMemo(
        () => getStateOptions(activePersons, filters.countryIsoCode),
        [activePersons, filters.countryIsoCode]
    );
    const cityOptions = useMemo(
        () =>
            getCityOptions(
                activePersons,
                filters.countryIsoCode,
                filters.stateProvince
            ),
        [activePersons, filters.countryIsoCode, filters.stateProvince]
    );

    const matched = useMemo(
        () =>
            filterPersons(activePersons, filters, {
                includeNationalId: canEdit,
            }),
        [activePersons, filters, canEdit]
    );

    const visibleResults = matched.slice(0, visibleCount);
    const hasMore = matched.length > visibleCount;
    const filtersActive = hasActiveSearchFilters(filters);

    const patchFilters = useCallback(
        (partial: Partial<PersonSearchFilters>) => {
            setFilters((current) => ({ ...current, ...partial }));
            setVisibleCount(SEARCH_PAGE_SIZE);
        },
        []
    );

    const resetFilters = useCallback(() => {
        setFilters(EMPTY_PERSON_SEARCH_FILTERS);
        setVisibleCount(SEARCH_PAGE_SIZE);
    }, []);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            setSearchOpen(open);
            if (!open) {
                resetFilters();
            }
        },
        [resetFilters, setSearchOpen]
    );

    const handleCountryChange = (value: string) => {
        patchFilters({
            countryIsoCode: value === ANY_VALUE ? '' : value,
            stateProvince: '',
            cityName: '',
        });
    };

    const handleStateChange = (value: string) => {
        patchFilters({
            stateProvince: value === ANY_VALUE ? '' : value,
            cityName: '',
        });
    };

    const handleCityChange = (value: string) => {
        patchFilters({
            cityName: value === ANY_VALUE ? '' : value,
        });
    };

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
            handleOpenChange(false);
            window.dispatchEvent(
                new CustomEvent<string>('focus-person', { detail: personId })
            );
        },
        [
            rootPersonId,
            unions,
            unionChildren,
            expandNodes,
            handleOpenChange,
        ]
    );

    return (
        <Dialog open={isSearchOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-[min(920px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[920px]">
                <DialogHeader className="border-b border-border px-5 py-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="size-4 text-muted-foreground" />
                        {t('search.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[minmax(260px,320px)_1fr]">
                    <div className="space-y-3 border-b border-border p-4 md:border-b-0 md:border-e md:overflow-y-auto">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {t('search.filters')}
                            </p>
                            {filtersActive && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={resetFilters}
                                >
                                    <X className="size-3.5 me-1" />
                                    {t('search.clearFilters')}
                                </Button>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="search-serial">
                                {t('person.serialNumber')}
                            </Label>
                            <Input
                                id="search-serial"
                                value={filters.serial}
                                onChange={(e) =>
                                    patchFilters({ serial: e.target.value })
                                }
                                placeholder={t('search.serialPlaceholder')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="search-english-name">
                                {t('person.englishName')}
                            </Label>
                            <Input
                                id="search-english-name"
                                value={filters.englishName}
                                onChange={(e) =>
                                    patchFilters({
                                        englishName: e.target.value,
                                    })
                                }
                                placeholder={t('person.englishNamePlaceholder')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="search-urdu-name">
                                {t('person.urduName')}
                            </Label>
                            <Input
                                id="search-urdu-name"
                                value={filters.urduName}
                                onChange={(e) =>
                                    patchFilters({ urduName: e.target.value })
                                }
                                placeholder={t('person.urduNamePlaceholder')}
                                dir="rtl"
                                className="font-urdu"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('person.gender')}</Label>
                            <Select
                                value={filters.gender || '__any__'}
                                onValueChange={(v) =>
                                    patchFilters({
                                        gender:
                                            !v || v === '__any__'
                                                ? ''
                                                : (v as Gender),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {filters.gender
                                            ? t(`person.${filters.gender}`)
                                            : t('search.anyGender')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__any__">
                                        {t('search.anyGender')}
                                    </SelectItem>
                                    <SelectItem value="male">
                                        {t('person.male')}
                                    </SelectItem>
                                    <SelectItem value="female">
                                        {t('person.female')}
                                    </SelectItem>
                                    <SelectItem value="other">
                                        {t('person.other')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('person.country')}</Label>
                            <SearchableCombobox
                                options={[
                                    {
                                        value: ANY_VALUE,
                                        label: t('search.anyCountry'),
                                    },
                                    ...countryOptions,
                                ]}
                                value={
                                    filters.countryIsoCode || ANY_VALUE
                                }
                                onChange={handleCountryChange}
                                placeholder={t('search.anyCountry')}
                                searchPlaceholder={t('person.countrySearch')}
                                noResultsText={t('search.noResults')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('person.stateProvince')}</Label>
                            <SearchableCombobox
                                options={[
                                    {
                                        value: ANY_VALUE,
                                        label: t('search.anyState'),
                                    },
                                    ...stateOptions,
                                ]}
                                value={filters.stateProvince || ANY_VALUE}
                                onChange={handleStateChange}
                                placeholder={t('search.anyState')}
                                searchPlaceholder={t('person.stateSearch')}
                                noResultsText={t('search.noResults')}
                                disabled={
                                    Boolean(filters.countryIsoCode) &&
                                    stateOptions.length === 0
                                }
                                emptyText={t('search.noStatesAvailable')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('person.city')}</Label>
                            <SearchableCombobox
                                options={[
                                    {
                                        value: ANY_VALUE,
                                        label: t('search.anyCity'),
                                    },
                                    ...cityOptions,
                                ]}
                                value={filters.cityName || ANY_VALUE}
                                onChange={handleCityChange}
                                placeholder={t('search.anyCity')}
                                searchPlaceholder={t('person.citySearch')}
                                noResultsText={t('search.noResults')}
                                disabled={
                                    Boolean(filters.stateProvince) &&
                                    cityOptions.length === 0
                                }
                                emptyText={t('search.noCitiesAvailable')}
                            />
                        </div>

                        {canEdit && (
                            <div className="space-y-1.5">
                                <Label htmlFor="search-national-id">
                                    {t('person.nationalId')}
                                </Label>
                                <Input
                                    id="search-national-id"
                                    value={filters.nationalIdentityNumber}
                                    onChange={(e) =>
                                        patchFilters({
                                            nationalIdentityNumber:
                                                e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        'search.nationalIdPlaceholder'
                                    )}
                                    autoComplete="off"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex min-h-0 flex-col">
                        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                {t('search.resultCount', {
                                    count: String(matched.length),
                                })}
                            </p>
                            {filtersActive && (
                                <Badge variant="secondary" className="text-xs">
                                    {t('search.filtersActive')}
                                </Badge>
                            )}
                        </div>

                        <ScrollArea className="min-h-[280px] flex-1">
                            <div className="space-y-1 p-3">
                                {visibleResults.length === 0 ? (
                                    <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                        {t('search.noResults')}
                                    </p>
                                ) : (
                                    visibleResults.map((person) => {
                                        const serial = formatSerialNumber(
                                            person.serial_number
                                        );
                                        return (
                                            <button
                                                key={person.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelect(person.id)
                                                }
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-accent"
                                            >
                                                <div
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                                        person.gender ===
                                                        'female'
                                                            ? 'bg-pink-50 text-pink-500 dark:bg-pink-950/60 dark:text-pink-300'
                                                            : 'bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                                                    }`}
                                                >
                                                    {person.gender ===
                                                    'female' ? (
                                                        <Heart className="size-3.5" />
                                                    ) : (
                                                        <User className="size-3.5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-sm font-medium ${
                                                            locale === 'ur'
                                                                ? 'font-urdu'
                                                                : ''
                                                        }`}
                                                        dir={
                                                            locale === 'ur'
                                                                ? 'rtl'
                                                                : 'ltr'
                                                        }
                                                    >
                                                        {getPersonName(
                                                            person.english_name,
                                                            person.urdu_name
                                                        )}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {[
                                                            serial,
                                                            person.city_name ||
                                                                person.state_province ||
                                                                person.country_name,
                                                            person.birth_year
                                                                ? `${person.birth_year}${
                                                                      person.death_year
                                                                          ? ` — ${person.death_year}`
                                                                          : ''
                                                                  }`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {hasMore && (
                            <div className="border-t border-border p-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        setVisibleCount(
                                            (count) => count + SEARCH_PAGE_SIZE
                                        )
                                    }
                                >
                                    {t('search.showMore', {
                                        remaining: String(
                                            matched.length - visibleCount
                                        ),
                                    })}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
