import type { Gender, Person } from '@/types';
import {
    formatSerialNumber,
    normalizeNationalIdentityNumber,
    normalizeSearchText,
} from '@/lib/person/format';

export const SEARCH_PAGE_SIZE = 10;

export interface PersonSearchFilters {
    serial: string;
    englishName: string;
    urduName: string;
    gender: Gender | '';
    countryIsoCode: string;
    stateProvince: string;
    cityName: string;
    nationalIdentityNumber: string;
}

export const EMPTY_PERSON_SEARCH_FILTERS: PersonSearchFilters = {
    serial: '',
    englishName: '',
    urduName: '',
    gender: '',
    countryIsoCode: '',
    stateProvince: '',
    cityName: '',
    nationalIdentityNumber: '',
};

export interface LocationOption {
    value: string;
    label: string;
}

function hasFilterValue(value: string): boolean {
    return value.trim().length > 0;
}

export function hasActiveSearchFilters(filters: PersonSearchFilters): boolean {
    return (
        hasFilterValue(filters.serial) ||
        hasFilterValue(filters.englishName) ||
        hasFilterValue(filters.urduName) ||
        filters.gender !== '' ||
        hasFilterValue(filters.countryIsoCode) ||
        hasFilterValue(filters.stateProvince) ||
        hasFilterValue(filters.cityName) ||
        hasFilterValue(filters.nationalIdentityNumber)
    );
}

function matchesSerial(person: Person, serialQuery: string): boolean {
    const q = serialQuery.trim();
    if (!q) return true;

    const formatted = formatSerialNumber(person.serial_number).toLowerCase();
    const lower = normalizeSearchText(q);
    const digits = lower.replace(/^ft-/, '').replace(/\D/g, '');

    if (formatted.includes(lower)) return true;
    if (digits && String(person.serial_number).includes(digits)) return true;
    return false;
}

/** AND-based matcher across every provided filter. */
export function personMatchesFilters(
    person: Person,
    filters: PersonSearchFilters,
    options?: { includeNationalId?: boolean }
): boolean {
    if (person.deleted) return false;

    if (!matchesSerial(person, filters.serial)) return false;

    if (hasFilterValue(filters.englishName)) {
        const q = normalizeSearchText(filters.englishName);
        if (!person.english_name.toLowerCase().includes(q)) return false;
    }

    if (hasFilterValue(filters.urduName)) {
        if (!person.urdu_name.includes(filters.urduName.trim())) return false;
    }

    if (filters.gender && person.gender !== filters.gender) return false;

    if (hasFilterValue(filters.countryIsoCode)) {
        if (person.country_iso_code !== filters.countryIsoCode) return false;
    }

    if (hasFilterValue(filters.stateProvince)) {
        if (person.state_province !== filters.stateProvince) return false;
    }

    if (hasFilterValue(filters.cityName)) {
        if (person.city_name !== filters.cityName) return false;
    }

    if (
        options?.includeNationalId &&
        hasFilterValue(filters.nationalIdentityNumber)
    ) {
        const queryDigits = normalizeNationalIdentityNumber(
            filters.nationalIdentityNumber
        );
        const storedDigits = normalizeNationalIdentityNumber(
            person.national_identity_number
        );
        if (!queryDigits || storedDigits !== queryDigits) return false;
    }

    return true;
}

export function filterPersons(
    persons: Person[],
    filters: PersonSearchFilters,
    options?: { includeNationalId?: boolean }
): Person[] {
    return persons.filter((person) =>
        personMatchesFilters(person, filters, options)
    );
}

export function getCountryOptions(persons: Person[]): LocationOption[] {
    const byCode = new Map<string, string>();
    for (const person of persons) {
        if (person.deleted || !person.country_iso_code) continue;
        const label = person.country_name || person.country_iso_code;
        if (!byCode.has(person.country_iso_code)) {
            byCode.set(person.country_iso_code, label);
        }
    }
    return Array.from(byCode.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export function getStateOptions(
    persons: Person[],
    countryIsoCode: string
): LocationOption[] {
    const values = new Set<string>();
    for (const person of persons) {
        if (person.deleted || !person.state_province) continue;
        if (countryIsoCode && person.country_iso_code !== countryIsoCode) {
            continue;
        }
        values.add(person.state_province);
    }
    return Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }));
}

export function getCityOptions(
    persons: Person[],
    countryIsoCode: string,
    stateProvince: string
): LocationOption[] {
    const values = new Set<string>();
    for (const person of persons) {
        if (person.deleted || !person.city_name) continue;
        if (countryIsoCode && person.country_iso_code !== countryIsoCode) {
            continue;
        }
        if (stateProvince && person.state_province !== stateProvince) {
            continue;
        }
        values.add(person.city_name);
    }
    return Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }));
}
