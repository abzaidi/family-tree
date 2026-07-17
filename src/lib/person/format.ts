import type { Person, PersonFormData } from '@/types';

export const EMPTY_PERSON_FORM: PersonFormData = {
    english_name: '',
    urdu_name: '',
    gender: 'male',
    birth_year: null,
    death_year: null,
    notes: '',
    country_iso_code: '',
    country_name: '',
    state_province_code: '',
    state_province: '',
    city_name: '',
    phone_country_code: '',
    national_identity_number: '',
};

export function formatSerialNumber(serial: number | null | undefined): string {
    if (serial == null || Number.isNaN(serial)) return '';
    return `FT-${String(serial).padStart(6, '0')}`;
}

export function personToFormData(person: Person): PersonFormData {
    return {
        english_name: person.english_name,
        urdu_name: person.urdu_name,
        gender: person.gender,
        birth_year: person.birth_year,
        death_year: person.death_year,
        notes: person.notes || '',
        country_iso_code: person.country_iso_code || '',
        country_name: person.country_name || '',
        state_province_code: person.state_province_code || '',
        state_province: person.state_province || '',
        city_name: person.city_name || '',
        phone_country_code: person.phone_country_code || '',
        national_identity_number: person.national_identity_number || '',
    };
}

export function toPublicPersonInsert(data: PersonFormData) {
    return {
        english_name: data.english_name,
        urdu_name: data.urdu_name,
        gender: data.gender,
        birth_year: data.birth_year,
        death_year: data.death_year,
        notes: data.notes || null,
        country_iso_code: data.country_iso_code || null,
        country_name: data.country_name || null,
        state_province_code: data.state_province_code || null,
        state_province: data.state_province || null,
        city_name: data.city_name || null,
        phone_country_code: data.phone_country_code || null,
    };
}

export function normalizeSearchText(value: string): string {
    return value.trim().toLowerCase();
}

/** Central matcher so Phase 2 can add attribute filters without rewriting UIs. */
export function personMatchesQuery(person: Person, query: string): boolean {
    const q = query.trim();
    if (!q) return true;

    const serial = formatSerialNumber(person.serial_number);
    const lower = normalizeSearchText(q);

    if (serial.toLowerCase().includes(lower)) return true;
    if (String(person.serial_number).includes(lower.replace(/^ft-/, ''))) return true;
    if (person.english_name.toLowerCase().includes(lower)) return true;
    // Urdu remains case-sensitive substring match
    if (person.urdu_name.includes(q)) return true;

    return false;
}

export function personSearchValue(person: Person): string {
    return [
        formatSerialNumber(person.serial_number),
        person.english_name,
        person.urdu_name,
        person.id,
    ]
        .filter(Boolean)
        .join(' ');
}
