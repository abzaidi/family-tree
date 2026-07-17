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
} from 'lucide-react';
import { useTreeStore } from '@/store/tree-store';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/hooks/useAuth';
import type { Person } from '@/types';

interface PersonDrawerProps {
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
    onAddChild: (person: Person) => void;
    onAddSpouse: (person: Person) => void;
    onAddParent: (person: Person) => void;
}

export function PersonDrawer({
    onEdit,
    onDelete,
    onAddChild,
    onAddSpouse,
    onAddParent,
}: PersonDrawerProps) {
    const { selectedPersonId, isDrawerOpen, setDrawerOpen, persons, unions, unionChildren } =
        useTreeStore();
    const { t, getPersonName, locale } = useI18n();
    const { canEdit } = useAuth();

    const person = persons.find((p) => p.id === selectedPersonId);

    if (!person) return null;

    const displayName = getPersonName(person.english_name, person.urdu_name);
    const isFemale = person.gender === 'female';

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
            <SheetContent className="w-[380px] sm:w-[420px] p-0 border-l border-gray-200">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div
                        className={`px-6 py-5 ${isFemale
                                ? 'bg-gradient-to-r from-pink-50 to-rose-50'
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                            }`}
                    >
                        <SheetHeader>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${isFemale
                                            ? 'bg-pink-100 text-pink-600'
                                            : 'bg-blue-100 text-blue-600'
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
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                        {t(`person.${person.gender}`)}
                                    </Badge>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    <ScrollArea className="flex-1 px-6">
                        <div className="py-4 space-y-5">
                            {/* Dates */}
                            {(person.birth_year || person.death_year) && (
                                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                                <div className="text-sm text-gray-500">
                                    {locale === 'ur'
                                        ? person.english_name
                                        : person.urdu_name && (
                                            <span className="font-urdu" dir="rtl">
                                                {person.urdu_name}
                                            </span>
                                        )}
                                </div>
                            )}

                            {/* Notes */}
                            {person.notes && (
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                                        {t('person.notes')}
                                    </p>
                                    <p className="text-sm text-gray-600">{person.notes}</p>
                                </div>
                            )}

                            <Separator />

                            {/* Parents */}
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {t('person.parents')}
                                </p>
                                {parents.length > 0 ? (
                                    <div className="space-y-1">
                                        {parents.map((p) => (
                                            <button
                                                key={p.id}
                                                className="block text-sm text-blue-600 hover:underline"
                                                onClick={() => useTreeStore.getState().selectPerson(p.id)}
                                            >
                                                {getPersonName(p.english_name, p.urdu_name)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">—</p>
                                )}
                            </div>

                            {/* Siblings */}
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {t('person.siblings')}
                                </p>
                                {siblings.length > 0 ? (
                                    <div className="space-y-1">
                                        {siblings.map((sibling) => (
                                            <button
                                                key={sibling.id}
                                                className="block text-sm text-violet-600 hover:underline"
                                                onClick={() =>
                                                    useTreeStore
                                                        .getState()
                                                        .selectPerson(sibling.id)
                                                }
                                            >
                                                {getPersonName(
                                                    sibling.english_name,
                                                    sibling.urdu_name
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">—</p>
                                )}
                            </div>

                            {/* Spouses */}
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5" />
                                    {t('person.spouses')}
                                </p>
                                {spouses.length > 0 ? (
                                    <div className="space-y-1">
                                        {spouses.map((s) => (
                                            <button
                                                key={s.id}
                                                className="block text-sm text-pink-600 hover:underline"
                                                onClick={() => useTreeStore.getState().selectPerson(s.id)}
                                            >
                                                {getPersonName(s.english_name, s.urdu_name)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">—</p>
                                )}
                            </div>

                            {/* Children */}
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1.5">
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
                                                    className="block text-sm text-green-600 hover:underline"
                                                    onClick={() =>
                                                        useTreeStore.getState().selectPerson(c.id)
                                                    }
                                                >
                                                    {getPersonName(c.english_name, c.urdu_name)}
                                                </button>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">—</p>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Actions */}
                    {canEdit && (
                        <div className="border-t border-gray-200 px-6 py-4 space-y-2">
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
                                    onClick={() => onAddParent(person)}
                                >
                                    <Users className="w-3.5 h-3.5 mr-1.5" />
                                    {t('action.addParent')}
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
