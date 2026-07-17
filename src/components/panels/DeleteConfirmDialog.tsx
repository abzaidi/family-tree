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
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { DeleteContext, Person } from '@/types';

export type DeleteChoice = 'only' | 'branch';

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    person: Person | null;
    deleteContext: DeleteContext | null;
    onConfirm: (choice: DeleteChoice) => Promise<boolean>;
}

export function DeleteConfirmDialog({
    open,
    onClose,
    person,
    deleteContext,
    onConfirm,
}: DeleteConfirmDialogProps) {
    const { t, getPersonName } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [choice, setChoice] = useState<DeleteChoice>(
        deleteContext?.canDeleteOnly ? 'only' : 'branch'
    );

    if (!person || !deleteContext) return null;

    const showChoice =
        deleteContext.canDeleteOnly && deleteContext.canDeleteBranch;

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        try {
            const success = await onConfirm(choice);
            if (success) {
                onClose();
            }
        } catch {
            setError(t('toast.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !loading) onClose();
            }}
        >
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-red-700 dark:text-red-400">
                                {t('delete.title')}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3 py-3">
                    <p className="text-sm text-muted-foreground">
                        {t('delete.confirm')}{' '}
                        <strong className="text-foreground">
                            {getPersonName(person.english_name, person.urdu_name)}
                        </strong>
                    </p>

                    {showChoice ? (
                        <div className="space-y-2">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setChoice('only')}
                                className={`w-full rounded-xl border p-3 text-start transition-colors ${
                                    choice === 'only'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:bg-accent'
                                }`}
                            >
                                <p className="text-sm font-medium text-foreground">
                                    {t('delete.onlyTitle')}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('delete.onlyDescription')}
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setChoice('branch')}
                                className={`w-full rounded-xl border p-3 text-start transition-colors ${
                                    choice === 'branch'
                                        ? 'border-destructive bg-destructive/10'
                                        : 'border-border hover:bg-accent'
                                }`}
                            >
                                <p className="text-sm font-medium text-foreground">
                                    {t('delete.branchTitle')}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('delete.branchDescription', {
                                        count: deleteContext.descendantCount,
                                    })}
                                </p>
                            </button>
                        </div>
                    ) : deleteContext.canDeleteBranch ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                {t('delete.branchDescription', {
                                    count: deleteContext.descendantCount,
                                })}
                            </p>
                            {deleteContext.isRoot && (
                                <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/80">
                                    {t('delete.rootOnlyBranch')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <p className="text-sm text-muted-foreground">
                                {t('delete.onlyDescription')}
                            </p>
                        </div>
                    )}

                    {choice === 'branch' && deleteContext.canDeleteBranch && (
                        <p className="text-xs text-muted-foreground">
                            {t('delete.warning')}
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {t('action.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => void handleConfirm()}
                        disabled={loading}
                    >
                        {loading ? t('state.loading') : t('action.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
