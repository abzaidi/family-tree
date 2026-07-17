'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    UserPlus,
    Users,
    Heart,
    Edit,
    Trash2,
    User,
    Calendar,
    MapPin,
    Phone,
    IdCard,
    Hash,
} from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/hooks/useAuth';
import { formatSerialNumber } from '@/lib/person/format';
import type { Person } from '@/types';

interface PersonDrawerProps {
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
    onAddChild: (person: Person) => void;
    onAddSpouse: (person: Person) => void;
}

export function PersonDrawer({
    onEdit,
    onDelete,
    onAddChild,
    onAddSpouse,
}: PersonDrawerProps) {
    const { selectedPersonId, isDrawerOpen, setDrawerOpen, persons, unions, unionChildren } =
        useTreeStore();
    const { t, getPersonName, locale } = useI18n();
    const { canEdit } = useAuth();

    const person = persons.find((p) => p.id === selectedPersonId);

    if (!person) return null;

    const displayName = getPersonName(person.english_name, person.urdu_name);
    const serial = formatSerialNumber(person.serial_number);
    const isFemale = person.gender === 'female';
    const locationParts = [
        person.city_name,
        person.state_province,
        person.country_name,
    ].filter(Boolean);
    const locationLabel = locationParts.join(', ');

    const personLabel = (p: Person) => {
        const name = getPersonName(p.english_name, p.urdu_name);
        const personSerial = formatSerialNumber(p.serial_number);
        return personSerial ? `${name} (${personSerial})` : name;
    };

    // Get spouses
    const personUnions = unions.filter(
        (u) => u.partner1_id === person.id || u.partner2_id === person.id
    );
    const spouses = personUnions
        .map((u) => {
            const spouseId =
                u.partner1_id === person.id ? u.partner2_id : u.partner1_id;
            return spouseId ? persons.find((p) => p.id === spouseId) : null;
        })
        .filter(Boolean) as Person[];

    // Get children across all unions
    const children = personUnions.flatMap((u) => {
        return unionChildren
            .filter((uc) => uc.union_id === u.id)
            .map((uc) => persons.find((p) => p.id === uc.child_id))
            .filter(Boolean) as Person[];
    });

    // Get parents
    const parentUnionChild = unionChildren.find((uc) => uc.child_id === person.id);
    let parents: Person[] = [];
    if (parentUnionChild) {
        const parentUnion = unions.find((u) => u.id === parentUnionChild.union_id);
        if (parentUnion) {
            const p1 = persons.find((p) => p.id === parentUnion.partner1_id);
            const p2 = parentUnion.partner2_id
                ? persons.find((p) => p.id === parentUnion.partner2_id)
                : null;
            parents = [p1, p2].filter(Boolean) as Person[];
        }
    }

    // Include full and half siblings who share at least one recorded parent
    const parentIds = new Set(parents.map((parent) => parent.id));
    const siblingUnionIds = new Set(
        unions
            .filter(
                (union) =>
                    parentIds.has(union.partner1_id) ||
                    (union.partner2_id !== null && parentIds.has(union.partner2_id))
            )
            .map((union) => union.id)
    );
    const siblingIds = new Set(
        unionChildren
            .filter(
                (child) =>
                    siblingUnionIds.has(child.union_id) &&
                    child.child_id !== person.id
            )
            .map((child) => child.child_id)
    );
    const siblings = persons.filter(
        (candidate) => siblingIds.has(candidate.id) && !candidate.deleted
    );

    return (
        <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-[380px] sm:w-[420px] p-0 border-l border-border">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div
                        className={`px-6 py-5 ${isFemale
                                ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/40'
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/40'
                            }`}
                    >
                        <SheetHeader>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${isFemale
                                            ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/60 dark:text-pink-300'
                                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300'
                                        }`}
                                >
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <SheetTitle
                                        className={`text-lg font-bold ${locale === 'ur' ? 'font-urdu' : ''
                                            }`}
                                    >
                                        {displayName}
                                    </SheetTitle>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <Badge variant="secondary" className="text-xs">
                                            {t(`person.${person.gender}`)}
                                        </Badge>
                                        {serial && (
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {serial}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    <ScrollArea className="flex-1 px-6">
                        <div className="py-4 space-y-5">
                            {/* Dates */}
                            {(person.birth_year || person.death_year) && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {person.birth_year && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {t('person.born')}: {person.birth_year}
                                        </span>
                                    )}
                                    {person.death_year && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {t('person.died')}: {person.death_year}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Alt name */}
                            {person.english_name && person.urdu_name && (
                                <div className="text-sm text-muted-foreground">
                                    {locale === 'ur'
                                        ? person.english_name
                                        : person.urdu_name && (
                                            <span className="font-urdu" dir="rtl">
                                                {person.urdu_name}
                                            </span>
                                        )}
                                </div>
                            )}

                            {serial && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Hash className="w-3.5 h-3.5" />
                                    <span>
                                        {t('person.serialNumber')}: {serial}
                                    </span>
                                </div>
                            )}

                            {locationLabel && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {t('person.location')}
                                    </p>
                                    <p className="text-sm text-foreground/80">{locationLabel}</p>
                                </div>
                            )}

                            {person.phone_country_code && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>
                                        {t('person.countryCode')}: {person.phone_country_code}
                                    </span>
                                </div>
                            )}

                            {canEdit && person.national_identity_number && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                                        <IdCard className="w-3.5 h-3.5" />
                                        {t('person.nationalId')}
                                    </p>
                                    <p className="text-sm text-foreground/80 font-mono">
                                        {person.national_identity_number}
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            {person.notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                        {t('person.notes')}
                                    </p>
                                    <p className="text-sm text-foreground/80">{person.notes}</p>
                                </div>
                            )}

                            <Separator />

                            {/* Parents */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {t('person.parents')}
                                </p>
                                {parents.length > 0 ? (
                                    <div className="space-y-1">
                                        {parents.map((p) => (
                                            <button
                                                key={p.id}
                                                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                onClick={() => useTreeStore.getState().selectPerson(p.id)}
                                            >
                                                {personLabel(p)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </div>

                            {/* Siblings */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {t('person.siblings')}
                                </p>
                                {siblings.length > 0 ? (
                                    <div className="space-y-1">
                                        {siblings.map((sibling) => (
                                            <button
                                                key={sibling.id}
                                                className="block text-sm text-violet-600 dark:text-violet-400 hover:underline"
                                                onClick={() =>
                                                    useTreeStore
                                                        .getState()
                                                        .selectPerson(sibling.id)
                                                }
                                            >
                                                {personLabel(sibling)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </div>

                            {/* Spouses */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5" />
                                    {t('person.spouses')}
                                </p>
                                {spouses.length > 0 ? (
                                    <div className="space-y-1">
                                        {spouses.map((s) => (
                                            <button
                                                key={s.id}
                                                className="block text-sm text-pink-600 dark:text-pink-400 hover:underline"
                                                onClick={() => useTreeStore.getState().selectPerson(s.id)}
                                            >
                                                {personLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </div>

                            {/* Children */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                    <UserPlus className="w-3.5 h-3.5" />
                                    {t('person.children')}
                                </p>
                                {children.length > 0 ? (
                                    <div className="space-y-1">
                                        {children
                                            .filter((c) => !c.deleted)
                                            .map((c) => (
                                                <button
                                                    key={c.id}
                                                    className="block text-sm text-green-600 dark:text-green-400 hover:underline"
                                                    onClick={() =>
                                                        useTreeStore.getState().selectPerson(c.id)
                                                    }
                                                >
                                                    {personLabel(c)}
                                                </button>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Actions */}
                    {canEdit && (
                        <div className="border-t border-border px-6 py-4 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => onAddChild(person)}
                                >
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                    {t('action.addChild')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => onAddSpouse(person)}
                                >
                                    <Heart className="w-3.5 h-3.5 mr-1.5" />
                                    {t('action.addSpouse')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => onEdit(person)}
                                >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                                    {t('action.edit')}
                                </Button>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => onDelete(person)}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                {t('action.delete')}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
