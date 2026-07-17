/** Browser-shaped Urdu/Nastaliq text → PNG for pdf-lib embedding. */

export const URDU_FONT_FAMILY = 'ExportNotoNastaliqUrdu';
const URDU_FONT_URL = '/fonts/NotoNastaliqUrdu-Regular.ttf';

let fontReady: Promise<void> | null = null;

export function ensureUrduFontLoaded(): Promise<void> {
    if (typeof document === 'undefined') {
        return Promise.reject(new Error('Urdu font requires a browser'));
    }
    if (!fontReady) {
        fontReady = (async () => {
            const face = new FontFace(
                URDU_FONT_FAMILY,
                `url(${URDU_FONT_URL})`,
                { weight: '400', style: 'normal' }
            );
            const loaded = await face.load();
            document.fonts.add(loaded);
            await document.fonts.ready;
        })().catch((err) => {
            fontReady = null;
            throw err;
        });
    }
    return fontReady;
}

export interface CanvasTextBlock {
    pngBytes: Uint8Array;
    /** Draw width in PDF points */
    width: number;
    /** Draw height in PDF points */
    height: number;
}

function wrapLogicalLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number
): string[] {
    const raw = text.trim() || '—';
    const words = raw.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    const widthOf = (s: string) => ctx.measureText(s).width;

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (widthOf(next) <= maxWidth) {
            current = next;
            continue;
        }
        if (current) {
            lines.push(current);
            current = word;
            if (lines.length >= maxLines) {
                current = '';
                break;
            }
        } else {
            // Overlong single word: hard-break by characters
            let remaining = word;
            while (remaining && lines.length < maxLines) {
                let cut = remaining.length;
                while (cut > 1 && widthOf(remaining.slice(0, cut)) > maxWidth) {
                    cut -= 1;
                }
                lines.push(remaining.slice(0, cut));
                remaining = remaining.slice(cut);
            }
            current = '';
            if (lines.length >= maxLines) break;
        }
    }
    if (current && lines.length < maxLines) {
        lines.push(current);
    }

    // Ellipsis if we still have leftover content
    if (lines.length >= maxLines && words.join(' ').length > lines.join(' ').length) {
        const last = lines[lines.length - 1] ?? '';
        let withEllipsis = `${last}…`;
        while (
            withEllipsis.length > 1 &&
            widthOf(withEllipsis) > maxWidth
        ) {
            withEllipsis = `${withEllipsis.slice(0, -2)}…`;
        }
        lines[lines.length - 1] = withEllipsis;
    }

    return lines.length > 0 ? lines : ['—'];
}

/**
 * Render RTL Urdu (or mixed) text with proper Nastaliq shaping via the browser.
 * Coordinates use a 1 CSS-px ≈ 1 PDF-point design size; rasterized at 2× for clarity.
 */
export async function renderUrduTextBlock(options: {
    text: string;
    fontSize: number;
    maxWidth: number;
    maxLines: number;
    lineHeight: number;
    color?: string;
    align?: 'right' | 'left';
}): Promise<CanvasTextBlock> {
    await ensureUrduFontLoaded();

    const {
        text,
        fontSize,
        maxWidth,
        maxLines,
        lineHeight,
        color = '#1f2430',
        align = 'right',
    } = options;

    const scale = 2;
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) throw new Error('Canvas unavailable');

    measureCtx.font = `${fontSize}px "${URDU_FONT_FAMILY}"`;
    measureCtx.direction = 'rtl';
    const lines = wrapLogicalLines(measureCtx, text, maxWidth, maxLines);
    const height = Math.max(lineHeight, lines.length * lineHeight);

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(maxWidth * scale);
    canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, maxWidth, height);
    ctx.font = `${fontSize}px "${URDU_FONT_FAMILY}"`;
    ctx.fillStyle = color;
    ctx.direction = 'rtl';
    ctx.textBaseline = 'alphabetic';
    // Nastaliq sits high; bias baseline within each line box
    const baselineOffset = fontSize * 0.85;

    lines.forEach((line, i) => {
        const y = i * lineHeight + baselineOffset;
        if (align === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(line, maxWidth, y);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(line, 0, y);
        }
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))),
            'image/png'
        );
    });
    const buffer = await blob.arrayBuffer();

    return {
        pngBytes: new Uint8Array(buffer),
        width: maxWidth,
        height,
    };
}
