'use client';

import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function LanguageSwitch() {
    const { locale, setLocale, t } = useI18n();

    const toggle = () => {
        setLocale(locale === 'en' ? 'ur' : 'en');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="gap-1.5 text-xs font-medium"
            aria-label={t('nav.language')}
        >
            <Globe className="w-4 h-4" />
            {locale === 'en' ? 'اردو' : 'English'}
        </Button>
    );
}
