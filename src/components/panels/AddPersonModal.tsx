'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PersonCombobox } from '@/components/ui/person-combobox';
import { PersonFormFields } from '@/components/panels/PersonFormFields';
import { useI18n } from '@/lib/i18n/context';
import { EMPTY_PERSON_FORM } from '@/lib/person/format';
import { useTreeStore } from '@/store/tree-store';
import type { Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

type AddMode = 'child' | 'spouse' | 'root' | 'insert';

interface AddPersonModalProps {
    open: boolean;
    onClose: () => void;
    mode: AddMode;
    targetPerson: Person | null;
    onSubmit: (
        data: PersonFormData,
        mode: AddMode,
        selectedUnionId?: string,
        selectedChildIds?: string[],
        selectedParentId?: string,
        selectedDirectChildId?: string
    ) => Promise<boolean>;
}

export function AddPersonModal({
    open,
    onClose,
    mode,
    targetPerson,
    onSubmit,
}: AddPersonModalProps) {
    const { t, getPersonName } = useI18n();
    const { unions, unionChildren, persons } = useTreeStore();

    const [formData, setFormData] = useState<PersonFormData>(EMPTY_PERSON_FORM);
    const [selectedUnionId, setSelectedUnionId] = useState<string>('');
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedDirectChildId, setSelectedDirectChildId] = useState('');
    const [loading, setLoading] = useState(false);

    const targetUnions =
        targetPerson && mode === 'child'
            ? unions.filter(
                  (u) =>
                      u.partner1_id === targetPerson.id ||
                      u.partner2_id === targetPerson.id
              )
            : [];

    const singleParentUnionIds = new Set(
        targetPerson && mode === 'spouse'
            ? unions
                  .filter(
                      (union) =>
                          union.partner1_id === targetPerson.id &&
                          union.partner2_id === null
                  )
                  .map((union) => union.id)
            : []
    );
    const eligibleChildren =
        mode === 'spouse'
            ? unionChildren
                  .filter((link) => singleParentUnionIds.has(link.union_id))
                  .map((link) => persons.find((person) => person.id === link.child_id))
                  .filter(
                      (person): person is Person =>
                          Boolean(person && !person.deleted)
                  )
            : [];

    const activePersons = persons.filter((person) => !person.deleted);
    const selectedChildLink = unionChildren.find(
        (link) => link.child_id === selectedDirectChildId
    );
    const selectedChildParentUnion = selectedChildLink
        ? unions.find((union) => union.id === selectedChildLink.union_id)
        : undefined;
    const isDirectRelationship = Boolean(
        selectedParentId &&
            selectedDirectChildId &&
            selectedChildParentUnion &&
            (selectedChildParentUnion.partner1_id === selectedParentId ||
                selectedChildParentUnion.partner2_id === selectedParentId)
    );
    const insertValidationError =
        mode !== 'insert' || !selectedParentId || !selectedDirectChildId
            ? null
            : selectedParentId === selectedDirectChildId
              ? t('insert.samePersonError')
              : !isDirectRelationship
                ? t('insert.notDirectError')
                : null;
    const insertSelectionValid =
        mode !== 'insert' ||
        Boolean(
            selectedParentId &&
                selectedDirectChildId &&
                selectedParentId !== selectedDirectChildId &&
                isDirectRelationship
        );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.english_name && !formData.urdu_name) {
            toast.error(t('person.nameRequired'));
            return;
        }
        if (!insertSelectionValid) {
            toast.error(insertValidationError || t('insert.selectionRequired'));
            return;
        }
        setLoading(true);
        try {
            const success = await onSubmit(
                formData,
                mode,
                selectedUnionId || undefined,
                selectedChildIds,
                selectedParentId || undefined,
                selectedDirectChildId || undefined
            );
            if (!success) return;
            setFormData(EMPTY_PERSON_FORM);
            setSelectedUnionId('');
            setSelectedChildIds([]);
            setSelectedParentId('');
            setSelectedDirectChildId('');
            onClose();
        } catch {
            toast.error(t('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const unionLabel = (unionId: string): string => {
        const union = targetUnions.find((u) => u.id === unionId);
        if (!union) return '';
        const spouseId =
            union.partner1_id === targetPerson?.id
                ? union.partner2_id
                : union.partner1_id;
        const spouse = spouseId
            ? persons.find((p) => p.id === spouseId)
            : null;
        return spouse
            ? getPersonName(spouse.english_name, spouse.urdu_name)
            : t('union.noSpouse');
    };

    const titleMap: Record<AddMode, string> = {
        child: 'action.addChild',
        spouse: 'action.addSpouse',
        root: 'action.addRoot',
        insert: 'action.insertMiddle',
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t(titleMap[mode])}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'insert' && (
                        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3">
                            <p className="text-sm text-muted-foreground">
                                {t('insert.description')}
                            </p>

                            <div className="space-y-1.5">
                                <Label>{t('insert.selectParent')}</Label>
                                <PersonCombobox
                                    persons={activePersons}
                                    value={selectedParentId}
                                    onChange={setSelectedParentId}
                                    placeholder={t('insert.selectParent')}
                                    searchPlaceholder={t('search.placeholder')}
                                    noResultsText={t('search.noResults')}
                                    getPersonName={getPersonName}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>{t('insert.selectChild')}</Label>
                                <PersonCombobox
                                    persons={activePersons}
                                    value={selectedDirectChildId}
                                    onChange={setSelectedDirectChildId}
                                    placeholder={t('insert.selectChild')}
                                    searchPlaceholder={t('search.placeholder')}
                                    noResultsText={t('search.noResults')}
                                    getPersonName={getPersonName}
                                />
                            </div>

                            {insertValidationError && (
                                <p className="text-sm text-destructive">
                                    {insertValidationError}
                                </p>
                            )}
                        </div>
                    )}

                    {mode === 'child' && targetUnions.length > 1 && (
                        <div className="space-y-1.5">
                            <Label>{t('union.selectSpouse')}</Label>
                            <Select
                                value={selectedUnionId}
                                onValueChange={(v) => setSelectedUnionId(v || '')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('union.selectSpouse')}>
                                        {selectedUnionId
                                            ? unionLabel(selectedUnionId)
                                            : t('union.selectSpouse')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {targetUnions.map((u) => {
                                        const spouseId =
                                            u.partner1_id === targetPerson?.id
                                                ? u.partner2_id
                                                : u.partner1_id;
                                        const spouse = spouseId
                                            ? persons.find((p) => p.id === spouseId)
                                            : null;
                                        return (
                                            <SelectItem key={u.id} value={u.id}>
                                                {spouse
                                                    ? getPersonName(
                                                          spouse.english_name,
                                                          spouse.urdu_name
                                                      )
                                                    : t('union.noSpouse')}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {mode === 'spouse' && eligibleChildren.length > 0 && (
                        <div className="space-y-2">
                            <Label>{t('union.spouseChildrenQuestion')}</Label>
                            <div className="grid gap-2 rounded-lg border border-border p-2">
                                <button
                                    type="button"
                                    aria-pressed={selectedChildIds.length === 0}
                                    onClick={() => setSelectedChildIds([])}
                                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                        selectedChildIds.length === 0
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent'
                                    }`}
                                >
                                    {t('union.none')}
                                </button>
                                {eligibleChildren.map((child) => {
                                    const selected = selectedChildIds.includes(
                                        child.id
                                    );
                                    return (
                                        <button
                                            key={child.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() =>
                                                setSelectedChildIds((current) =>
                                                    selected
                                                        ? current.filter(
                                                              (id) => id !== child.id
                                                          )
                                                        : [...current, child.id]
                                                )
                                            }
                                            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                selected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-accent'
                                            }`}
                                        >
                                            {getPersonName(
                                                child.english_name,
                                                child.urdu_name
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <PersonFormFields
                        idPrefix="add"
                        formData={formData}
                        onChange={setFormData}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('action.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !insertSelectionValid}
                        >
                            {loading ? t('state.loading') : t('action.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
