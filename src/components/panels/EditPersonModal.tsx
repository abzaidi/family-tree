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
import { PersonFormFields } from '@/components/panels/PersonFormFields';
import { useI18n } from '@/lib/i18n/context';
import { personToFormData } from '@/lib/person/format';
import type { Person, PersonFormData } from '@/types';
import { toast } from 'sonner';

interface EditPersonModalProps {
    open: boolean;
    onClose: () => void;
    person: Person | null;
    onSubmit: (id: string, data: Partial<PersonFormData>) => Promise<boolean>;
}

function EditPersonForm({
    person,
    onClose,
    onSubmit,
}: {
    person: Person;
    onClose: () => void;
    onSubmit: (id: string, data: Partial<PersonFormData>) => Promise<boolean>;
}) {
    const { t } = useI18n();
    const [formData, setFormData] = useState(() => personToFormData(person));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.english_name && !formData.urdu_name) {
            toast.error(t('person.nameRequired'));
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <PersonFormFields
                idPrefix="edit"
                formData={formData}
                onChange={setFormData}
                serialNumber={person.serial_number}
            />

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    {t('action.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? t('state.loading') : t('action.save')}
                </Button>
            </DialogFooter>
        </form>
    );
}

export function EditPersonModal({
    open,
    onClose,
    person,
    onSubmit,
}: EditPersonModalProps) {
    const { t } = useI18n();

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('action.editPerson')}</DialogTitle>
                </DialogHeader>

                {person && (
                    <EditPersonForm
                        key={person.id}
                        person={person}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
