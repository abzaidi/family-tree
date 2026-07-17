import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';
import { getPhonecodes } from '@countrystatecity/phonecodes';
import type { LocationCity, LocationCountry, LocationState } from './types';

function normalizePhoneCode(raw: string | undefined | null): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export async function listCountries(): Promise<LocationCountry[]> {
    const [countries, phonecodes] = await Promise.all([
        getCountries(),
        getPhonecodes(),
    ]);
    const dialByIso = new Map(
        phonecodes.map((entry) => [entry.iso2.toUpperCase(), entry.dialCode])
    );

    return countries
        .map((country) => ({
            iso2: country.iso2,
            name: country.name,
            phoneCode: normalizePhoneCode(
                dialByIso.get(country.iso2.toUpperCase()) ?? country.phonecode
            ),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listStates(countryCode: string): Promise<LocationState[]> {
    const states = await getStatesOfCountry(countryCode.toUpperCase());
    return states
        .map((state) => ({
            iso2: state.iso2,
            name: state.name,
            countryCode: state.country_code,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listCities(
    countryCode: string,
    stateCode: string
): Promise<LocationCity[]> {
    const cities = await getCitiesOfState(
        countryCode.toUpperCase(),
        stateCode.toUpperCase()
    );
    return cities
        .map((city) => ({
            name: city.name,
            stateCode: city.state_code,
            countryCode: city.country_code,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
