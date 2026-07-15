'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Locale, TranslationStrings } from '@/types';
import { en } from './en';
import { ur } from './ur';

const translations: Record<Locale, TranslationStrings> = { en, ur };

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    dir: 'ltr' | 'rtl';
    getPersonName: (englishName: string, urduName: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        const saved = localStorage.getItem('family-tree-locale') as Locale;
        if (saved && (saved === 'en' || saved === 'ur')) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem('family-tree-locale', l);
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>) => {
            let value = translations[locale][key] || translations['en'][key] || key;
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    value = value.replace(`{${k}}`, String(v));
                });
            }
            return value;
        },
        [locale]
    );

    const dir = locale === 'ur' ? 'rtl' : 'ltr';

    const getPersonName = useCallback(
        (englishName: string, urduName: string) => {
            if (locale === 'ur') {
                return urduName || englishName || '—';
            }
            return englishName || urduName || '—';
        },
        [locale]
    );

    useEffect(() => {
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', locale);
    }, [dir, locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, dir, getPersonName }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useI18n must be used within I18nProvider');
    return context;
}
