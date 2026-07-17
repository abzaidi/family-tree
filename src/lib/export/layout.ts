import { formatSerialNumber } from '@/lib/person/format';
import {
    buildRelationshipIndex,
    collectDescendantSubtree,
    EXPORT_ROOT_SERIAL,
    findExportAncestralChain,
    findPersonBySerial,
    getChildren,
    getSpouses,
    type RelationshipIndex,
} from '@/lib/tree/relationships';
import type { Person, Union, UnionChild } from '@/types';
import {
    A4_HEIGHT,
    A4_WIDTH,
    CARD_GAP_X,
    CARD_GAP_Y,
    CARD_WIDTH,
    CHAIN_PER_ROW,
    CONTINUATION_BLOCK_HEIGHT,
    MAX_NAME_LINES,
    PAGE_MARGIN,
    cardHeightForNameLines,
    estimateNameLineCount,
    type ExportCard,
    type ExportContinuation,
    type ExportDocument,
    type ExportLanguage,
    type ExportLine,
    type ExportPage,
    type ExportPersonView,
} from './types';

function personDisplayName(person: Person, language: ExportLanguage): string {
    if (language === 'ur') {
        const urdu = person.urdu_name?.trim();
        if (urdu) return urdu;
        return person.english_name?.trim() || '—';
    }
    return person.english_name?.trim() || person.urdu_name?.trim() || '—';
}

function personYears(person: Person): string | null {
    if (!person.birth_year && !person.death_year) return null;
    return `${person.birth_year ?? '?'} — ${person.death_year ?? ''}`;
}

function toView(person: Person, language: ExportLanguage): ExportPersonView {
    return {
        id: person.id,
        serial: formatSerialNumber(person.serial_number),
        name: personDisplayName(person, language),
        years: personYears(person),
    };
}

function contentWidth(): number {
    return A4_WIDTH - PAGE_MARGIN * 2;
}

function rowSlotX(slot: number, rtl: boolean): number {
    const totalRowWidth =
        CHAIN_PER_ROW * CARD_WIDTH + (CHAIN_PER_ROW - 1) * CARD_GAP_X;
    const startX = PAGE_MARGIN + (contentWidth() - totalRowWidth) / 2;
    const ltrX = startX + slot * (CARD_WIDTH + CARD_GAP_X);
    if (!rtl) return ltrX;
    return startX + (CHAIN_PER_ROW - 1 - slot) * (CARD_WIDTH + CARD_GAP_X);
}

function makeCard(
    view: ExportPersonView,
    x: number,
    y: number,
    height: number
): ExportCard {
    return {
        personId: view.id,
        serial: view.serial,
        name: view.name,
        years: view.years,
        x,
        y,
        width: CARD_WIDTH,
        height,
    };
}

/** Connect card edges with a 0.5pt overlap so PDF hairlines don't show gaps. */
function connectCards(a: ExportCard, b: ExportCard): ExportLine {
    const overlap = 0.5;
    const aRight = a.x + a.width;
    const bRight = b.x + b.width;
    if (Math.abs(a.y - b.y) < 1) {
        if (a.x < b.x) {
            return {
                x1: aRight - overlap,
                y1: a.y + a.height / 2,
                x2: b.x + overlap,
                y2: b.y + b.height / 2,
            };
        }
        return {
            x1: a.x + overlap,
            y1: a.y + a.height / 2,
            x2: bRight - overlap,
            y2: b.y + b.height / 2,
        };
    }
    return {
        x1: a.x + a.width / 2,
        y1: a.y + a.height - overlap,
        x2: b.x + b.width / 2,
        y2: b.y + overlap,
    };
}

interface PageBuilder {
    pages: ExportPage[];
    current: ExportPage;
    cursorY: number;
    rtl: boolean;
    cardHeight: number;
    continuationLabels: { title: string };
}

function newPage(
    builder: PageBuilder,
    continuation: ExportContinuation | null
): void {
    const page: ExportPage = {
        continuation,
        cards: [],
        lines: [],
    };
    builder.pages.push(page);
    builder.current = page;
    builder.cursorY =
        PAGE_MARGIN +
        (continuation
            ? CONTINUATION_BLOCK_HEIGHT + 12
            : builder.pages.length === 1
              ? 36
              : 24);
}

function ensurePage(builder: PageBuilder): void {
    if (builder.pages.length === 0) {
        newPage(builder, null);
    }
}

function needsNewPage(builder: PageBuilder, blockHeight: number): boolean {
    return builder.cursorY + blockHeight > A4_HEIGHT - PAGE_MARGIN;
}

function startContinuationPage(
    builder: PageBuilder,
    from: ExportPersonView
): void {
    newPage(builder, {
        title: builder.continuationLabels.title,
        name: from.name,
        serial: from.serial,
    });
}

function layoutAncestralChain(
    builder: PageBuilder,
    chain: ExportPersonView[]
): ExportCard | null {
    ensurePage(builder);
    let previous: ExportCard | null = null;
    let slot = 0;
    const h = builder.cardHeight;

    for (let i = 0; i < chain.length; i++) {
        const view = chain[i];

        if (slot === 0 && needsNewPage(builder, h + CARD_GAP_Y)) {
            if (previous) {
                startContinuationPage(builder, {
                    id: previous.personId,
                    serial: previous.serial,
                    name: previous.name,
                    years: previous.years,
                });
            } else {
                newPage(builder, null);
            }
            previous = null;
        } else if (slot > 0 && needsNewPage(builder, h + CARD_GAP_Y)) {
            if (previous) {
                startContinuationPage(builder, {
                    id: previous.personId,
                    serial: previous.serial,
                    name: previous.name,
                    years: previous.years,
                });
            }
            slot = 0;
            previous = null;
        }

        const x = rowSlotX(slot, builder.rtl);
        const y = builder.cursorY;
        const card = makeCard(view, x, y, h);
        builder.current.cards.push(card);

        if (previous) {
            builder.current.lines.push(connectCards(previous, card));
        }

        previous = card;
        slot += 1;
        if (slot >= CHAIN_PER_ROW) {
            slot = 0;
            builder.cursorY += h + CARD_GAP_Y;
        }
    }

    if (slot !== 0) {
        builder.cursorY += h + CARD_GAP_Y;
    }

    return previous;
}

interface CoupleBlock {
    primary: ExportPersonView;
    spouses: ExportPersonView[];
    children: ExportPersonView[];
}

function buildCoupleBlocks(
    index: RelationshipIndex,
    selectedId: string,
    language: ExportLanguage
): CoupleBlock[] {
    const { bloodIds } = collectDescendantSubtree(index, selectedId);
    const bloodSet = new Set(bloodIds);
    const blocks: CoupleBlock[] = [];

    for (const id of bloodIds) {
        const person = index.personById.get(id)!;
        const spouses = getSpouses(index, id).map((s) => toView(s, language));
        const children = getChildren(index, id)
            .filter((c) => bloodSet.has(c.id))
            .map((c) => toView(c, language));

        blocks.push({
            primary: toView(person, language),
            spouses,
            children,
        });
    }

    return blocks;
}

/**
 * Deduplicate child listings: only attach children when the primary is
 * partner1 (or sole parent). Uses blood membership, not mere person existence.
 */
function filterBlocksForUniqueChildren(
    index: RelationshipIndex,
    bloodIds: string[],
    blocks: CoupleBlock[]
): CoupleBlock[] {
    const bloodSet = new Set(bloodIds);
    return blocks.map((block) => {
        const primaryId = block.primary.id;
        const unions = index.unionsByPerson.get(primaryId) ?? [];
        const allowedChildIds = new Set<string>();
        for (const union of unions) {
            const isPartner2 = union.partner2_id === primaryId;
            if (isPartner2 && bloodSet.has(union.partner1_id)) {
                continue;
            }
            for (const childId of index.childrenByUnion.get(union.id) ?? []) {
                allowedChildIds.add(childId);
            }
        }
        return {
            ...block,
            children: block.children.filter((c) => allowedChildIds.has(c.id)),
        };
    });
}

/** Skip leaf-only blocks that would redraw someone already shown as a child. */
function filterRenderableBlocks(blocks: CoupleBlock[]): CoupleBlock[] {
    return blocks.filter(
        (block) => block.spouses.length > 0 || block.children.length > 0
    );
}

function layoutCoupleBlock(builder: PageBuilder, block: CoupleBlock): void {
    const h = builder.cardHeight;
    const members = [block.primary, ...block.spouses];
    const childCount = block.children.length;
    const coupleWidth =
        members.length * CARD_WIDTH + (members.length - 1) * CARD_GAP_X;
    const childrenWidth =
        childCount > 0
            ? childCount * CARD_WIDTH + (childCount - 1) * CARD_GAP_X
            : 0;
    const blockWidth = Math.max(coupleWidth, childrenWidth);

    // Marriage bar + stubs: 10 down to bar, 14 down to children
    const dropToBar = 10;
    const dropToChild = 14;
    const blockHeight =
        h + (childCount > 0 ? dropToBar + dropToChild + h : 0) + CARD_GAP_Y;

    if (needsNewPage(builder, blockHeight)) {
        startContinuationPage(builder, block.primary);
    }

    const originX = PAGE_MARGIN + (contentWidth() - blockWidth) / 2;
    const coupleStartX =
        originX + Math.max(0, (blockWidth - coupleWidth) / 2);
    const y = builder.cursorY;

    const adultCards: ExportCard[] = [];
    members.forEach((member, idx) => {
        let x = coupleStartX + idx * (CARD_WIDTH + CARD_GAP_X);
        if (builder.rtl) {
            x =
                coupleStartX +
                (members.length - 1 - idx) * (CARD_WIDTH + CARD_GAP_X);
        }
        const card = makeCard(member, x, y, h);
        adultCards.push(card);
        builder.current.cards.push(card);
    });

    // Spouse connectors through mid-card
    for (let i = 0; i < adultCards.length - 1; i++) {
        builder.current.lines.push(
            connectCards(adultCards[i], adultCards[i + 1])
        );
    }

    if (childCount === 0) {
        builder.cursorY += h + CARD_GAP_Y;
        return;
    }

    const adultBottom = y + h;
    const barY = adultBottom + dropToBar;
    const childY = barY + dropToChild;
    const unionX =
        adultCards.reduce((sum, c) => sum + c.x + c.width / 2, 0) /
        adultCards.length;
    const childrenStartX =
        originX + Math.max(0, (blockWidth - childrenWidth) / 2);

    // Drop from spouse-line midpoint (in the gap between partners) to the bar.
    // Sole parent: drop from the bottom of the card instead.
    const stemStartY =
        adultCards.length > 1 ? y + h / 2 : adultBottom;
    builder.current.lines.push({
        x1: unionX,
        y1: stemStartY,
        x2: unionX,
        y2: barY,
    });

    const childCards: ExportCard[] = [];
    block.children.forEach((child, idx) => {
        let x = childrenStartX + idx * (CARD_WIDTH + CARD_GAP_X);
        if (builder.rtl) {
            x =
                childrenStartX +
                (childCount - 1 - idx) * (CARD_WIDTH + CARD_GAP_X);
        }
        const card = makeCard(child, x, childY, h);
        childCards.push(card);
        builder.current.cards.push(card);
    });

    if (childCards.length === 1) {
        const cx = childCards[0].x + childCards[0].width / 2;
        builder.current.lines.push({
            x1: unionX,
            y1: barY,
            x2: cx,
            y2: childY + 0.5,
        });
    } else {
        const centers = childCards.map((c) => c.x + c.width / 2);
        const left = Math.min(...centers);
        const right = Math.max(...centers);
        builder.current.lines.push({
            x1: left,
            y1: barY,
            x2: right,
            y2: barY,
        });
        // Ensure the drop meets the rail even when unionX is between children
        if (unionX < left || unionX > right) {
            builder.current.lines.push({
                x1: unionX,
                y1: barY,
                x2: unionX < left ? left : right,
                y2: barY,
            });
        }
        for (const card of childCards) {
            const cx = card.x + card.width / 2;
            builder.current.lines.push({
                x1: cx,
                y1: barY,
                x2: cx,
                y2: childY + 0.5,
            });
        }
    }

    builder.cursorY = childY + h + CARD_GAP_Y;
}

function collectViewsForHeight(
    chain: ExportPersonView[],
    blocks: CoupleBlock[]
): ExportPersonView[] {
    const views: ExportPersonView[] = [...chain];
    for (const block of blocks) {
        views.push(block.primary, ...block.spouses, ...block.children);
    }
    return views;
}

export type BuildExportError =
    | 'missing_export_root'
    | 'not_descendant'
    | 'missing_person';

export interface BuildExportResult {
    document: ExportDocument | null;
    error: BuildExportError | null;
}

export function buildExportDocument(options: {
    persons: Person[];
    unions: Union[];
    unionChildren: UnionChild[];
    selectedPersonId: string;
    language: ExportLanguage;
    labels: {
        title: string;
        continuedFrom: string;
    };
}): BuildExportResult {
    const index = buildRelationshipIndex(
        options.persons,
        options.unions,
        options.unionChildren
    );
    const selected = index.personById.get(options.selectedPersonId);
    if (!selected) {
        return { document: null, error: 'missing_person' };
    }

    const root = findPersonBySerial(index, EXPORT_ROOT_SERIAL);
    if (!root) {
        return { document: null, error: 'missing_export_root' };
    }

    const chainPeople = findExportAncestralChain(
        index,
        root.id,
        selected.id
    );
    if (!chainPeople) {
        return { document: null, error: 'not_descendant' };
    }

    const rtl = options.language === 'ur';
    const chainViews = chainPeople.map((p) => toView(p, options.language));

    const { bloodIds } = collectDescendantSubtree(index, selected.id);
    let blocks = buildCoupleBlocks(index, selected.id, options.language);
    blocks = filterBlocksForUniqueChildren(index, bloodIds, blocks);
    blocks = filterRenderableBlocks(blocks);

    const allViews = collectViewsForHeight(chainViews, blocks);
    const maxNameLines = Math.min(
        MAX_NAME_LINES,
        Math.max(
            1,
            ...allViews.map((v) =>
                estimateNameLineCount(v.name, CARD_WIDTH - 12, rtl)
            )
        )
    );
    const cardHeight = cardHeightForNameLines(maxNameLines, rtl);

    const builder: PageBuilder = {
        pages: [],
        current: { continuation: null, cards: [], lines: [] },
        cursorY: PAGE_MARGIN,
        rtl,
        cardHeight,
        continuationLabels: { title: options.labels.continuedFrom },
    };

    layoutAncestralChain(builder, chainViews);
    builder.cursorY += 12;

    for (const block of blocks) {
        layoutCoupleBlock(builder, block);
    }

    if (builder.pages.length === 0) {
        newPage(builder, null);
    }

    return {
        document: {
            language: options.language,
            rtl,
            title: options.labels.title,
            pages: builder.pages,
            pageWidth: A4_WIDTH,
            pageHeight: A4_HEIGHT,
            margin: PAGE_MARGIN,
            cardHeight,
            maxNameLines,
        },
        error: null,
    };
}
