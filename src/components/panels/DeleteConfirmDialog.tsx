'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { Person } from '@/types';
import { useState } from 'react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    person: Person | null;
    descendantCount: number;
    onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
    open,
    onClose,
    person,
    descendantCount,
    onConfirm,
}: DeleteConfirmDialogProps) {
    const { t, getPersonName } = useI18n();
    const [loading, setLoading] = useState(false);

    if (!person) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-red-700 dark:text-red-400">
                                {t('delete.title')}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {t('delete.confirm')}{' '}
                        <strong className="text-foreground">{getPersonName(person.english_name, person.urdu_name)}</strong>
                    </p>

                    {descendantCount > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                ⚠️ {t('delete.descendants').replace('{count}', String(descendantCount))}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">{t('delete.warning')}</p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('action.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? t('state.loading') : t('action.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
