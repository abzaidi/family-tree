'use client';

import { useState, useEffect } from 'react';
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
import type { Gender, Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

interface EditPersonModalProps {
    open: boolean;
    onClose: () => void;
    person: Person | null;
    onSubmit: (id: string, data: Partial<PersonFormData>) => Promise<boolean>;
}

export function EditPersonModal({
    open,
    onClose,
    person,
    onSubmit,
}: EditPersonModalProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<PersonFormData>({
        english_name: '',
        urdu_name: '',
        gender: 'male',
        birth_year: null,
        death_year: null,
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (person) {
            setFormData({
                english_name: person.english_name,
                urdu_name: person.urdu_name,
                gender: person.gender,
                birth_year: person.birth_year,
                death_year: person.death_year,
                notes: person.notes || '',
            });
        }
    }, [person]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!person) return;
        if (!formData.english_name && !formData.urdu_name) {
            toast.error('At least one name is required');
            return;
        }
        setLoading(true);
        try {
            const success = await onSubmit(person.id, formData);
            if (success) {
                toast.success(t('toast.saved'));
                onClose();
            }
        } catch {
            toast.error(t('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{t('action.editPerson')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_english_name">
                                {t('person.englishName')}
                            </Label>
                            <Input
                                id="edit_english_name"
                                value={formData.english_name}
                                onChange={(e) =>
                                    setFormData((d) => ({ ...d, english_name: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_urdu_name">{t('person.urduName')}</Label>
                            <Input
                                id="edit_urdu_name"
                                value={formData.urdu_name}
                                onChange={(e) =>
                                    setFormData((d) => ({ ...d, urdu_name: e.target.value }))
                                }
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
                            <Label htmlFor="edit_birth_year">{t('person.birthYear')}</Label>
                            <Input
                                id="edit_birth_year"
                                type="number"
                                value={formData.birth_year ?? ''}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        birth_year: e.target.value ? Number(e.target.value) : null,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_death_year">{t('person.deathYear')}</Label>
                            <Input
                                id="edit_death_year"
                                type="number"
                                value={formData.death_year ?? ''}
                                onChange={(e) =>
                                    setFormData((d) => ({
                                        ...d,
                                        death_year: e.target.value ? Number(e.target.value) : null,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit_notes">{t('person.notes')}</Label>
                        <Textarea
                            id="edit_notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((d) => ({ ...d, notes: e.target.value }))
                            }
                            rows={3}
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
