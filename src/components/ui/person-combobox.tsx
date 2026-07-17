'use client';

import { useMemo } from 'react';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { formatSerialNumber, personSearchValue } from '@/lib/person/format';
import type { Person } from '@/types';

interface PersonComboboxProps {
    persons: Person[];
    value: string;
    onChange: (personId: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    noResultsText: string;
    getPersonName: (englishName: string, urduName: string) => string;
}

export function PersonCombobox({
    persons,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    noResultsText,
    getPersonName,
}: PersonComboboxProps) {
    const options = useMemo(
        () =>
            persons.map((person) => {
                const name = getPersonName(person.english_name, person.urdu_name);
                const serial = formatSerialNumber(person.serial_number);
                return {
                    value: person.id,
                    label: serial ? `${name} (${serial})` : name,
                    keywords: personSearchValue(person),
                };
            }),
        [getPersonName, persons]
    );

    return (
        <SearchableCombobox
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
        />
    );
}
