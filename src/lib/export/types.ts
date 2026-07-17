import type { Locale } from '@/types';

export type ExportLanguage = Locale;

export interface ExportCard {
    personId: string;
    serial: string;
    name: string;
    years: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ExportLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ExportContinuation {
    title: string;
    name: string;
    serial: string;
}

export interface ExportPage {
    continuation: ExportContinuation | null;
    cards: ExportCard[];
    lines: ExportLine[];
}

export interface ExportDocument {
    language: ExportLanguage;
    rtl: boolean;
    title: string;
    pages: ExportPage[];
    pageWidth: number;
    pageHeight: number;
    margin: number;
    cardHeight: number;
    maxNameLines: number;
}

export interface ExportPersonView {
    id: string;
    serial: string;
    name: string;
    years: string | null;
}

/** A4 points (1 pt = 1/72 in). */
export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;
export const PAGE_MARGIN = 40;
export const CHAIN_PER_ROW = 4;
export const CARD_WIDTH = 118;
export const CARD_GAP_X = 16;
export const CARD_GAP_Y = 24;
export const CONTINUATION_BLOCK_HEIGHT = 56;
export const MAX_NAME_LINES = 3;
export const NAME_LINE_HEIGHT = 11;
/** Nastaliq needs more vertical room per line than Helvetica. */
export const URDU_NAME_LINE_HEIGHT = 16;
export const CARD_PAD_Y = 8;
export const SERIAL_LINE_HEIGHT = 10;
export const YEARS_LINE_HEIGHT = 10;

/** Minimum card height (1 name line + serial + years). */
export const CARD_HEIGHT_BASE =
    CARD_PAD_Y +
    SERIAL_LINE_HEIGHT +
    NAME_LINE_HEIGHT +
    YEARS_LINE_HEIGHT +
    CARD_PAD_Y;

/** @deprecated Prefer cardHeightForNameLines — kept for callers expecting a constant. */
export const CARD_HEIGHT = CARD_HEIGHT_BASE;

export function cardHeightForNameLines(
    nameLines: number,
    rtl = false
): number {
    const lines = Math.min(MAX_NAME_LINES, Math.max(1, nameLines));
    const nameLineHeight = rtl ? URDU_NAME_LINE_HEIGHT : NAME_LINE_HEIGHT;
    return (
        CARD_PAD_Y +
        SERIAL_LINE_HEIGHT +
        lines * nameLineHeight +
        YEARS_LINE_HEIGHT +
        CARD_PAD_Y +
        (rtl ? 4 : 0)
    );
}

/** Rough line-count estimate before the PDF font is available. */
export function estimateNameLineCount(
    name: string,
    maxWidth: number,
    rtl: boolean
): number {
    if (!name) return 1;
    const avgChar = rtl ? 6.5 : 4.6;
    const charsPerLine = Math.max(6, Math.floor(maxWidth / avgChar));
    return Math.min(
        MAX_NAME_LINES,
        Math.max(1, Math.ceil(name.length / charsPerLine))
    );
}
