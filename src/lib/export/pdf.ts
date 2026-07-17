import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { formatSerialNumber } from '@/lib/person/format';
import {
    CARD_PAD_Y,
    MAX_NAME_LINES,
    NAME_LINE_HEIGHT,
    SERIAL_LINE_HEIGHT,
    URDU_NAME_LINE_HEIGHT,
    type ExportCard,
    type ExportDocument,
    type ExportLanguage,
} from './types';
import {
    ensureUrduFontLoaded,
    renderUrduTextBlock,
} from './urdu-canvas';

/** Wrap LTR text for Helvetica PDF drawing. */
function wrapLtr(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    maxLines: number
): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    const pushTruncated = (line: string) => {
        let out = line;
        while (out.length > 1 && font.widthOfTextAtSize(out, size) > maxWidth) {
            out = out.slice(0, -1);
        }
        if (out !== line && out.length > 0) {
            out = `${out.slice(0, -1)}…`;
            while (
                out.length > 1 &&
                font.widthOfTextAtSize(out, size) > maxWidth
            ) {
                out = out.slice(0, -1);
            }
        }
        lines.push(out);
    };

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
            current = next;
            continue;
        }
        if (current) {
            if (lines.length + 1 >= maxLines) {
                pushTruncated(`${current} ${word}`);
                return lines;
            }
            lines.push(current);
            current = word;
            if (font.widthOfTextAtSize(current, size) > maxWidth) {
                while (
                    current.length > 1 &&
                    font.widthOfTextAtSize(current, size) > maxWidth
                ) {
                    let cut = current.length - 1;
                    while (
                        cut > 1 &&
                        font.widthOfTextAtSize(current.slice(0, cut), size) >
                            maxWidth
                    ) {
                        cut -= 1;
                    }
                    if (lines.length + 1 >= maxLines) {
                        pushTruncated(current);
                        return lines;
                    }
                    lines.push(current.slice(0, cut));
                    current = current.slice(cut);
                }
            }
        } else {
            let remaining = word;
            while (remaining) {
                if (lines.length + 1 >= maxLines) {
                    pushTruncated(remaining);
                    return lines;
                }
                let cut = remaining.length;
                while (
                    cut > 1 &&
                    font.widthOfTextAtSize(remaining.slice(0, cut), size) >
                        maxWidth
                ) {
                    cut -= 1;
                }
                lines.push(remaining.slice(0, cut));
                remaining = remaining.slice(cut);
            }
            current = '';
        }
    }
    if (current) {
        if (lines.length >= maxLines) {
            const last = lines.pop() ?? '';
            pushTruncated(`${last} ${current}`);
        } else {
            lines.push(current);
        }
    }
    return lines.length > 0 ? lines : ['—'];
}

function drawLatinLine(
    page: PDFPage,
    text: string,
    font: PDFFont,
    size: number,
    x: number,
    y: number,
    maxWidth: number
): void {
    let line = text;
    while (line.length > 1 && font.widthOfTextAtSize(line, size) > maxWidth) {
        line = line.slice(0, -1);
    }
    if (line !== text && line.length > 0) {
        line = `${line.slice(0, -1)}…`;
    }
    page.drawText(line, {
        x,
        y,
        size,
        font,
        color: rgb(0.12, 0.14, 0.18),
    });
}

function drawEnglishCard(
    page: PDFPage,
    card: ExportCard,
    font: PDFFont,
    maxNameLines: number
): void {
    page.drawRectangle({
        x: card.x,
        y: page.getHeight() - card.y - card.height,
        width: card.width,
        height: card.height,
        borderColor: rgb(0.55, 0.62, 0.7),
        borderWidth: 1,
        color: rgb(0.98, 0.99, 1),
    });

    const pad = 6;
    const top = page.getHeight() - card.y;
    const textX = card.x + pad;
    const maxWidth = card.width - pad * 2;
    let cursor = top - CARD_PAD_Y - 2;

    drawLatinLine(page, card.serial, font, 7, textX, cursor - 7, maxWidth);
    cursor -= SERIAL_LINE_HEIGHT;

    const nameLines = wrapLtr(card.name, font, 8, maxWidth, maxNameLines);
    for (const line of nameLines) {
        drawLatinLine(page, line, font, 8, textX, cursor - 8, maxWidth);
        cursor -= NAME_LINE_HEIGHT;
    }
    cursor -= (maxNameLines - nameLines.length) * NAME_LINE_HEIGHT;

    if (card.years) {
        drawLatinLine(page, card.years, font, 7, textX, cursor - 7, maxWidth);
    }
}

async function drawUrduCard(
    page: PDFPage,
    pdfDoc: PDFDocument,
    card: ExportCard,
    latinFont: PDFFont,
    maxNameLines: number
): Promise<void> {
    page.drawRectangle({
        x: card.x,
        y: page.getHeight() - card.y - card.height,
        width: card.width,
        height: card.height,
        borderColor: rgb(0.55, 0.62, 0.7),
        borderWidth: 1,
        color: rgb(0.98, 0.99, 1),
    });

    const pad = 6;
    const pageHeight = page.getHeight();
    const top = pageHeight - card.y;
    const textX = card.x + pad;
    const maxWidth = card.width - pad * 2;
    let cursor = top - CARD_PAD_Y - 2;

    drawLatinLine(page, card.serial, latinFont, 7, textX, cursor - 7, maxWidth);
    cursor -= SERIAL_LINE_HEIGHT;

    const nameBlock = await renderUrduTextBlock({
        text: card.name,
        fontSize: 10,
        maxWidth,
        maxLines: maxNameLines,
        lineHeight: URDU_NAME_LINE_HEIGHT,
        align: 'right',
    });
    const nameImage = await pdfDoc.embedPng(nameBlock.pngBytes);
    // cursor is already PDF Y (from page bottom) at the top of the name area
    page.drawImage(nameImage, {
        x: textX,
        y: cursor - nameBlock.height,
        width: nameBlock.width,
        height: nameBlock.height,
    });
    cursor -= maxNameLines * URDU_NAME_LINE_HEIGHT;

    if (card.years) {
        drawLatinLine(page, card.years, latinFont, 7, textX, cursor - 7, maxWidth);
    }
}

export async function renderExportPdf(
    documentModel: ExportDocument
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const rtl = documentModel.rtl;
    const maxNameLines = documentModel.maxNameLines || MAX_NAME_LINES;

    if (rtl) {
        await ensureUrduFontLoaded();
    }

    const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let pageIndex = 0; pageIndex < documentModel.pages.length; pageIndex++) {
        const modelPage = documentModel.pages[pageIndex];
        const page = pdfDoc.addPage([
            documentModel.pageWidth,
            documentModel.pageHeight,
        ]);
        const pageHeight = page.getHeight();

        if (pageIndex === 0) {
            if (rtl) {
                const titleBlock = await renderUrduTextBlock({
                    text: documentModel.title,
                    fontSize: 14,
                    maxWidth:
                        documentModel.pageWidth - documentModel.margin * 2,
                    maxLines: 2,
                    lineHeight: 20,
                    align: 'right',
                });
                const titleImage = await pdfDoc.embedPng(titleBlock.pngBytes);
                page.drawImage(titleImage, {
                    x:
                        documentModel.pageWidth -
                        documentModel.margin -
                        titleBlock.width,
                    y: pageHeight - documentModel.margin - titleBlock.height + 4,
                    width: titleBlock.width,
                    height: titleBlock.height,
                });
            } else {
                const title = documentModel.title;
                const titleSize = 13;
                page.drawText(title, {
                    x: documentModel.margin,
                    y: pageHeight - documentModel.margin,
                    size: titleSize,
                    font: latinBold,
                    color: rgb(0.1, 0.12, 0.16),
                });
            }
        }

        if (modelPage.continuation) {
            const blockTop = pageHeight - documentModel.margin - 8;
            if (rtl) {
                const contTitle = await renderUrduTextBlock({
                    text: modelPage.continuation.title,
                    fontSize: 9,
                    maxWidth:
                        documentModel.pageWidth - documentModel.margin * 2,
                    maxLines: 1,
                    lineHeight: 14,
                    align: 'right',
                    color: '#59636e',
                });
                const contTitleImg = await pdfDoc.embedPng(contTitle.pngBytes);
                page.drawImage(contTitleImg, {
                    x:
                        documentModel.pageWidth -
                        documentModel.margin -
                        contTitle.width,
                    y: blockTop - contTitle.height,
                    width: contTitle.width,
                    height: contTitle.height,
                });
                const contName = await renderUrduTextBlock({
                    text: modelPage.continuation.name,
                    fontSize: 11,
                    maxWidth:
                        documentModel.pageWidth - documentModel.margin * 2,
                    maxLines: 1,
                    lineHeight: 16,
                    align: 'right',
                });
                const contNameImg = await pdfDoc.embedPng(contName.pngBytes);
                page.drawImage(contNameImg, {
                    x:
                        documentModel.pageWidth -
                        documentModel.margin -
                        contName.width,
                    y: blockTop - 16 - contName.height,
                    width: contName.width,
                    height: contName.height,
                });
            } else {
                page.drawText(modelPage.continuation.title, {
                    x: documentModel.margin,
                    y: blockTop,
                    size: 9,
                    font: latinFont,
                    color: rgb(0.35, 0.4, 0.45),
                });
                page.drawText(modelPage.continuation.name, {
                    x: documentModel.margin,
                    y: blockTop - 16,
                    size: 11,
                    font: latinFont,
                    color: rgb(0.1, 0.12, 0.16),
                });
            }
            page.drawText(modelPage.continuation.serial, {
                x: rtl
                    ? documentModel.pageWidth -
                      documentModel.margin -
                      latinFont.widthOfTextAtSize(
                          modelPage.continuation.serial,
                          8
                      )
                    : documentModel.margin,
                y: blockTop - 32,
                size: 8,
                font: latinFont,
                color: rgb(0.35, 0.4, 0.45),
            });
        }

        for (const line of modelPage.lines) {
            page.drawLine({
                start: {
                    x: line.x1,
                    y: pageHeight - line.y1,
                },
                end: {
                    x: line.x2,
                    y: pageHeight - line.y2,
                },
                thickness: 1,
                color: rgb(0.45, 0.52, 0.58),
            });
        }

        for (const card of modelPage.cards) {
            if (rtl) {
                await drawUrduCard(
                    page,
                    pdfDoc,
                    card,
                    latinFont,
                    maxNameLines
                );
            } else {
                drawEnglishCard(page, card, latinFont, maxNameLines);
            }
        }

        const label = `${pageIndex + 1} / ${documentModel.pages.length}`;
        const labelWidth = latinFont.widthOfTextAtSize(label, 8);
        page.drawText(label, {
            x: (documentModel.pageWidth - labelWidth) / 2,
            y: 18,
            size: 8,
            font: latinFont,
            color: rgb(0.5, 0.55, 0.6),
        });
    }

    return pdfDoc.save();
}

export function downloadPdfBytes(
    bytes: Uint8Array,
    filename: string
): void {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function exportFilename(
    serialNumber: number,
    language: ExportLanguage
): string {
    return `family-tree-${formatSerialNumber(serialNumber)}-${language}.pdf`;
}
