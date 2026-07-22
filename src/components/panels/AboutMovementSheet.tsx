'use client';

import { useCallback } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Building2,
    Copy,
    ExternalLink,
    HeartHandshake,
    MessageCircle,
    Phone,
    TreePine,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const MOVEMENT_NAME = 'Tehreeq e Muhiban e Ghulaman e Mustafa';
const MOVEMENT_FACEBOOK_URL =
    'https://www.facebook.com/TehreekeMuhibaneGhulamaneMustafa';
const JAZZCASH_NUMBER = '03212211140';
const JAZZCASH_HOLDER = 'Syed Rashid Ali Zaidi';
const WHATSAPP_NUMBER = '03219225554';
const WHATSAPP_CONTACT = 'Syed Rashid Ali Zaidi';
/** Pakistan mobile without leading 0, for wa.me */
const WHATSAPP_E164 = '923219225554';

interface AboutMovementSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function CopyableRow({
    label,
    value,
    onCopy,
    copyLabel,
    mono = false,
}: {
    label: string;
    value: string;
    onCopy: (value: string) => void;
    copyLabel: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                    className={cn(
                        'mt-0.5 text-sm font-medium text-foreground break-all',
                        mono && 'font-mono tracking-wide'
                    )}
                >
                    {value}
                </p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={() => onCopy(value)}
                aria-label={copyLabel}
                title={copyLabel}
            >
                <Copy className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
}

export function AboutMovementSheet({
    open,
    onOpenChange,
}: AboutMovementSheetProps) {
    const { t, dir } = useI18n();

    const copyValue = useCallback(
        async (value: string) => {
            try {
                await navigator.clipboard.writeText(value);
                toast.success(t('about.copied'));
            } catch {
                toast.error(t('about.copyFailed'));
            }
        },
        [t]
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={dir === 'rtl' ? 'left' : 'right'}
                className="w-[min(100vw,400px)] sm:w-[420px] p-0 border-border"
            >
                <div className="flex h-full flex-col">
                    <div className="border-b border-border bg-gradient-to-br from-emerald-50 via-teal-50/80 to-background px-6 py-5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-background">
                        <SheetHeader className="gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                                    <TreePine className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <SheetTitle className="text-lg">
                                        {t('about.title')}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm">
                                        {t('about.subtitle')}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="space-y-6 px-6 py-5">
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                                        {t('about.movementSection')}
                                    </h3>
                                </div>
                                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/25">
                                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                        {t('about.movementHeading')}
                                    </p>
                                    <a
                                        href={MOVEMENT_FACEBOOK_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 block text-base font-semibold leading-snug text-foreground hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                    >
                                        {MOVEMENT_NAME}
                                    </a>
                                    <a
                                        href={MOVEMENT_FACEBOOK_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        {t('about.facebookPage')}
                                    </a>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {t('about.movementBlurb')}
                                    </p>
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <HeartHandshake className="h-4 w-4" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                                        {t('about.donateSection')}
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('about.donateBlurb')}
                                </p>
                                <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {t('about.jazzcash')}
                                        </p>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                            {t('about.mobileWallet')}
                                        </span>
                                    </div>
                                    <CopyableRow
                                        label={t('about.accountNumber')}
                                        value={JAZZCASH_NUMBER}
                                        onCopy={copyValue}
                                        copyLabel={t('about.copy')}
                                        mono
                                    />
                                    <CopyableRow
                                        label={t('about.accountHolder')}
                                        value={JAZZCASH_HOLDER}
                                        onCopy={copyValue}
                                        copyLabel={t('about.copy')}
                                    />
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                                        {t('about.contactSection')}
                                    </h3>
                                </div>
                                <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <p className="text-sm font-semibold text-foreground">
                                        {t('about.whatsapp')}
                                    </p>
                                    <CopyableRow
                                        label={t('about.number')}
                                        value={WHATSAPP_NUMBER}
                                        onCopy={copyValue}
                                        copyLabel={t('about.copy')}
                                        mono
                                    />
                                    <CopyableRow
                                        label={t('about.contactPerson')}
                                        value={WHATSAPP_CONTACT}
                                        onCopy={copyValue}
                                        copyLabel={t('about.copy')}
                                    />
                                    <a
                                        href={`https://wa.me/${WHATSAPP_E164}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            buttonVariants({ size: 'default' }),
                                            'w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]'
                                        )}
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        {t('about.openWhatsApp')}
                                    </a>
                                </div>
                            </section>
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
