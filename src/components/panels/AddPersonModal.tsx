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
import { useI18n } from '@/lib/i18n/context';
import { useTreeStore } from '@/store/tree-store';
import type { Gender, Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

type AddMode = 'child' | 'spouse' | 'root';

interface AddPersonModalProps {
    open: boolean;
    onClose: () => void;
    mode: AddMode;
    targetPerson: Person | null;
    onSubmit: (
        data: PersonFormData,
        mode: AddMode,
        selectedUnionId?: string,
        selectedChildIds?: string[]
    ) => Promise<void>;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.english_name && !formData.urdu_name) {
            toast.error('At least one name is required');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(
                formData,
                mode,
                selectedUnionId || undefined,
                selectedChildIds
            );
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
            onClose();
        } catch {
            toast.error(t('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    const titleMap: Record<AddMode, string> = {
        child: 'action.addChild',
        spouse: 'action.addSpouse',
        root: 'action.addRoot',
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

                    <div className="space-y-1.5">
                        <Label>{t('person.gender')}</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(v) =>
                                v && setFormData((d) => ({ ...d, gender: v as Gender }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
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
                                    <SelectValue placeholder={t('union.selectSpouse')} />
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
                        <Button type="submit" disabled={loading}>
                            {loading ? t('state.loading') : t('action.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
