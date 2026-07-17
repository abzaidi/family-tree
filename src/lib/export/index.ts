import { buildExportDocument } from './layout';
import { downloadPdfBytes, exportFilename, renderExportPdf } from './pdf';
import type { ExportLanguage } from './types';
import type { Person, Union, UnionChild } from '@/types';

export type { ExportLanguage } from './types';
export { EXPORT_ROOT_SERIAL, isExportEligible, buildRelationshipIndex } from '@/lib/tree/relationships';

export async function exportPersonTreePdf(options: {
    persons: Person[];
    unions: Union[];
    unionChildren: UnionChild[];
    selectedPerson: Person;
    language: ExportLanguage;
    labels: {
        title: string;
        continuedFrom: string;
    };
}): Promise<{ ok: true } | { ok: false; error: string }> {
    const built = buildExportDocument({
        persons: options.persons,
        unions: options.unions,
        unionChildren: options.unionChildren,
        selectedPersonId: options.selectedPerson.id,
        language: options.language,
        labels: options.labels,
    });

    if (!built.document || built.error) {
        return { ok: false, error: built.error || 'unknown' };
    }

    const bytes = await renderExportPdf(built.document);
    downloadPdfBytes(
        bytes,
        exportFilename(options.selectedPerson.serial_number, options.language)
    );
    return { ok: true };
}
