'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { en } from '@/lib/i18n/en';
import { ur } from '@/lib/i18n/ur';
import { formatSerialNumber } from '@/lib/person/format';
import {
    exportPersonTreePdf,
    type ExportLanguage,
} from '@/lib/export';
import { useTreeStore } from '@/store/tree-store';
import type { Person } from '@/types';
import { toast } from 'sonner';
import { Download, Languages } from 'lucide-react';

function exportPersonLabel(person: Person, language: ExportLanguage): string {
    if (language === 'ur') {
        return person.urdu_name?.trim() || person.english_name?.trim() || '—';
    }
    return person.english_name?.trim() || person.urdu_name?.trim() || '—';
}

function exportLabel(
    language: ExportLanguage,
    key: 'export.documentTitle' | 'export.continuedFrom',
    params?: Record<string, string>
): string {
    const dict = language === 'ur' ? ur : en;
    let value = dict[key] ?? key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            value = value.replace(`{${k}}`, v);
        }
    }
    return value;
}

interface ExportLanguageDialogProps {
    open: boolean;
    person: Person | null;
    onClose: () => void;
}

export function ExportLanguageDialog({
    open,
    person,
    onClose,
}: ExportLanguageDialogProps) {
    const { t, getPersonName } = useI18n();
    const { persons, unions, unionChildren } = useTreeStore();
    const [loading, setLoading] = useState<ExportLanguage | null>(null);

    const handleExport = async (language: ExportLanguage) => {
        if (!person) return;
        setLoading(language);
        try {
            const result = await exportPersonTreePdf({
                persons,
                unions,
                unionChildren,
                selectedPerson: person,
                language,
                labels: {
                    title: exportLabel(language, 'export.documentTitle', {
                        name: exportPersonLabel(person, language),
                    }),
                    continuedFrom: exportLabel(
                        language,
                        'export.continuedFrom'
                    ),
                },
            });
            if (!result.ok) {
                const key =
                    result.error === 'missing_export_root'
                        ? 'export.errorMissingRoot'
                        : result.error === 'not_descendant'
                          ? 'export.errorNotDescendant'
                          : 'export.errorGeneric';
                toast.error(t(key));
                return;
            }
            toast.success(t('export.success'));
            onClose();
        } catch {
            toast.error(t('export.errorGeneric'));
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Languages className="size-4" />
                        {t('export.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {person
                            ? t('export.description', {
                                  name: getPersonName(
                                      person.english_name,
                                      person.urdu_name
                                  ),
                                  serial: formatSerialNumber(
                                      person.serial_number
                                  ),
                              })
                            : t('export.descriptionFallback')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2 pt-2">
                    <Button
                        type="button"
                        disabled={Boolean(loading)}
                        onClick={() => handleExport('en')}
                        className="justify-start gap-2"
                    >
                        <Download className="size-4" />
                        {loading === 'en'
                            ? t('state.loading')
                            : t('export.downloadEnglish')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={Boolean(loading)}
                        onClick={() => handleExport('ur')}
                        className="justify-start gap-2"
                    >
                        <Download className="size-4" />
                        {loading === 'ur'
                            ? t('state.loading')
                            : t('export.downloadUrdu')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
