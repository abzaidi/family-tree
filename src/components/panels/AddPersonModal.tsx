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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useTreeStore } from '@/store/tree-store';
import type { Gender, Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

type AddMode = 'child' | 'spouse' | 'root' | 'insert';

interface PersonComboboxProps {
    persons: Person[];
    value: string;
    onChange: (personId: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    noResultsText: string;
    getPersonName: (englishName: string, urduName: string) => string;
}

function PersonCombobox({
    persons,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    noResultsText,
    getPersonName,
}: PersonComboboxProps) {
    const [open, setOpen] = useState(false);
    const selected = persons.find((person) => person.id === value);

    return (
        <div className="space-y-1.5">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
                <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
                    {selected
                        ? getPersonName(selected.english_name, selected.urdu_name)
                        : placeholder}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            {open && (
                <div className="rounded-lg border border-border bg-popover shadow-md">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} autoFocus />
                        <CommandList className="max-h-40">
                            <CommandEmpty>{noResultsText}</CommandEmpty>
                            {persons.map((person) => (
                                <CommandItem
                                    key={person.id}
                                    // Name + id keeps duplicate names distinct while
                                    // still matching typed name text
                                    value={`${person.english_name} ${person.urdu_name} ${person.id}`}
                                    data-checked={person.id === value}
                                    onSelect={() => {
                                        onChange(person.id);
                                        setOpen(false);
                                    }}
                                >
                                    {getPersonName(person.english_name, person.urdu_name)}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}

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

    const [formData, setFormData] = useState<PersonFormData>({
        english_name: '',
        urdu_name: '',
        gender: 'male',
        birth_year: null,
        death_year: null,
        notes: '',
    });
    const [selectedUnionId, setSelectedUnionId] = useState<string>('');
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedDirectChildId, setSelectedDirectChildId] = useState('');
    const [loading, setLoading] = useState(false);

    // Get unions for the target person (needed for "Add Child" flow)
    const targetUnions =
        targetPerson && mode === 'child'
            ? unions.filter(
                (u) =>
                    u.partner1_id === targetPerson.id ||
                    u.partner2_id === targetPerson.id
            )
            : [];

    // Only children in this person's single-parent unions can be assigned to a
    // newly added spouse. Children already belonging to a couple are excluded.
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
                .filter((person): person is Person => Boolean(person && !person.deleted))
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
        (
            selectedChildParentUnion.partner1_id === selectedParentId ||
            selectedChildParentUnion.partner2_id === selectedParentId
        )
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
            toast.error('At least one name is required');
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
            setFormData({
                english_name: '',
                urdu_name: '',
                gender: 'male',
                birth_year: null,
                death_year: null,
                notes: '',
            });
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

    // Base UI's Select renders the raw value (a UUID) unless display text is
    // provided explicitly, so resolve union labels for the trigger ourselves
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
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{t(titleMap[mode])}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="english_name">{t('person.englishName')}</Label>
                            <Input
                                id="english_name"
                                value={formData.english_name}
                                onChange={(e) =>
                                    setFormData((d) => ({ ...d, english_name: e.target.value }))
                                }
                                placeholder="English name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="urdu_name">{t('person.urduName')}</Label>
                            <Input
                                id="urdu_name"
                                value={formData.urdu_name}
                                onChange={(e) =>
                                    setFormData((d) => ({ ...d, urdu_name: e.target.value }))
                                }
                                placeholder="اردو نام"
                                dir="rtl"
                                className="font-urdu"
                            />
                        </div>
                    </div>

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

                    <div className="space-y-1.5">
                        <Label>{t('person.gender')}</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(v) =>
                                v && setFormData((d) => ({ ...d, gender: v as Gender }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    {t(`person.${formData.gender}`)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">{t('person.male')}</SelectItem>
                                <SelectItem value="female">{t('person.female')}</SelectItem>
                                <SelectItem value="other">{t('person.other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="birth_year">{t('person.birthYear')}</Label>
                            <Input
                                id="birth_year"
                                type="number"
                                value={formData.birth_year ?? ''}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        birth_year: e.target.value ? Number(e.target.value) : null,
                                    }))
                                }
                                placeholder="e.g. 1950"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="death_year">{t('person.deathYear')}</Label>
                            <Input
                                id="death_year"
                                type="number"
                                value={formData.death_year ?? ''}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        death_year: e.target.value ? Number(e.target.value) : null,
                                    }))
                                }
                                placeholder="e.g. 2020"
                            />
                        </div>
                    </div>

                    {/* Union selection for adding child */}
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
                                    const selected = selectedChildIds.includes(child.id);
                                    return (
                                        <button
                                            key={child.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() =>
                                                setSelectedChildIds((current) =>
                                                    selected
                                                        ? current.filter((id) => id !== child.id)
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

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">{t('person.notes')}</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((d) => ({ ...d, notes: e.target.value }))
                            }
                            rows={3}
                            placeholder={t('person.notes')}
                        />
                    </div>

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
