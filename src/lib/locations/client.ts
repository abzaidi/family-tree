import type { LocationCity, LocationCountry, LocationState } from './types';

const countriesCache: { value: LocationCountry[] | null; promise: Promise<LocationCountry[]> | null } = {
    value: null,
    promise: null,
};

const statesCache = new Map<string, LocationState[]>();
const citiesCache = new Map<string, LocationCity[]>();

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
            typeof body.error === 'string' ? body.error : `Request failed: ${url}`
        );
    }
    return response.json() as Promise<T>;
}

export async function fetchCountries(): Promise<LocationCountry[]> {
    if (countriesCache.value) return countriesCache.value;
    if (!countriesCache.promise) {
        countriesCache.promise = fetchJson<{ countries: LocationCountry[] }>(
            '/api/locations/countries'
        )
            .then((data) => {
                countriesCache.value = data.countries;
                return data.countries;
            })
            .finally(() => {
                countriesCache.promise = null;
            });
    }
    return countriesCache.promise;
}

export async function fetchStates(countryCode: string): Promise<LocationState[]> {
    const key = countryCode.toUpperCase();
    const cached = statesCache.get(key);
    if (cached) return cached;

    const data = await fetchJson<{ states: LocationState[] }>(
        `/api/locations/states?country=${encodeURIComponent(key)}`
    );
    statesCache.set(key, data.states);
    return data.states;
}

export async function fetchCities(
    countryCode: string,
    stateCode: string
): Promise<LocationCity[]> {
    const key = `${countryCode.toUpperCase()}:${stateCode.toUpperCase()}`;
    const cached = citiesCache.get(key);
    if (cached) return cached;

    const data = await fetchJson<{ cities: LocationCity[] }>(
        `/api/locations/cities?country=${encodeURIComponent(countryCode.toUpperCase())}&state=${encodeURIComponent(stateCode.toUpperCase())}`
    );
    citiesCache.set(key, data.cities);
    return data.cities;
}
