'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { fetchCities, fetchCountries, fetchStates } from '@/lib/locations/client';
import { LOCATION_OTHER_VALUE } from '@/lib/locations/types';
import type { LocationCity, LocationCountry, LocationState } from '@/lib/locations/types';
import { formatSerialNumber } from '@/lib/person/format';
import { useI18n } from '@/lib/i18n/context';
import type { Gender, PersonFormData } from '@/types';

interface PersonFormFieldsProps {
    idPrefix: string;
    formData: PersonFormData;
    onChange: (next: PersonFormData) => void;
    /** Read-only serial shown in edit mode when available. */
    serialNumber?: number | null;
}

function deriveStateSelection(formData: PersonFormData): string {
    if (formData.state_province_code) return formData.state_province_code;
    if (formData.state_province) return LOCATION_OTHER_VALUE;
    return '';
}

function deriveCitySelection(
    formData: PersonFormData,
    cities: LocationCity[]
): string {
    if (!formData.state_province) return '';
    if (!formData.state_province_code) return LOCATION_OTHER_VALUE;
    if (
        formData.city_name &&
        cities.some((city) => city.name === formData.city_name)
    ) {
        return formData.city_name;
    }
    if (formData.city_name) return LOCATION_OTHER_VALUE;
    return '';
}

export function PersonFormFields({
    idPrefix,
    formData,
    onChange,
    serialNumber,
}: PersonFormFieldsProps) {
    const { t } = useI18n();
    const [countries, setCountries] = useState<LocationCountry[]>([]);
    const [countriesLoaded, setCountriesLoaded] = useState(false);
    const [statesCache, setStatesCache] = useState<{
        country: string;
        items: LocationState[];
    } | null>(null);
    const [citiesCache, setCitiesCache] = useState<{
        key: string;
        items: LocationCity[];
    } | null>(null);
    // Local overrides cover "Other" before the user types custom text.
    const [stateOverride, setStateOverride] = useState<string | null>(null);
    const [cityOverride, setCityOverride] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchCountries()
            .then((data) => {
                if (cancelled) return;
                setCountries(data);
                setCountriesLoaded(true);
            })
            .catch(() => {
                if (cancelled) return;
                setCountries([]);
                setCountriesLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const country = formData.country_iso_code;
        if (!country) return;
        if (statesCache?.country === country) return;

        let cancelled = false;
        fetchStates(country)
            .then((items) => {
                if (cancelled) return;
                setStatesCache({ country, items });
            })
            .catch(() => {
                if (cancelled) return;
                setStatesCache({ country, items: [] });
            });
        return () => {
            cancelled = true;
        };
    }, [formData.country_iso_code, statesCache?.country]);

    useEffect(() => {
        const country = formData.country_iso_code;
        const state = formData.state_province_code;
        if (!country || !state) return;
        const key = `${country}:${state}`;
        if (citiesCache?.key === key) return;

        let cancelled = false;
        fetchCities(country, state)
            .then((items) => {
                if (cancelled) return;
                setCitiesCache({ key, items });
            })
            .catch(() => {
                if (cancelled) return;
                setCitiesCache({ key, items: [] });
            });
        return () => {
            cancelled = true;
        };
    }, [
        formData.country_iso_code,
        formData.state_province_code,
        citiesCache?.key,
    ]);

    const cityKey =
        formData.country_iso_code && formData.state_province_code
            ? `${formData.country_iso_code}:${formData.state_province_code}`
            : '';
    const states = useMemo(
        () =>
            formData.country_iso_code &&
            statesCache?.country === formData.country_iso_code
                ? statesCache.items
                : [],
        [formData.country_iso_code, statesCache]
    );
    const cities = useMemo(
        () => (cityKey && citiesCache?.key === cityKey ? citiesCache.items : []),
        [cityKey, citiesCache]
    );

    const stateSelection = stateOverride ?? deriveStateSelection(formData);
    const citySelection = cityOverride ?? deriveCitySelection(formData, cities);

    const countryOptions = useMemo(
        () =>
            countries.map((country) => ({
                value: country.iso2,
                label: country.name,
                keywords: `${country.iso2} ${country.phoneCode}`,
            })),
        [countries]
    );

    const stateOptions = useMemo(
        () => [
            ...states.map((state) => ({
                value: state.iso2,
                label: state.name,
                keywords: state.iso2,
            })),
            {
                value: LOCATION_OTHER_VALUE,
                label: t('person.otherOption'),
                featured: true,
                description: t('person.enterManually'),
            },
        ],
        [states, t]
    );

    const cityOptions = useMemo(
        () => [
            ...cities.map((city) => ({
                value: city.name,
                label: city.name,
            })),
            {
                value: LOCATION_OTHER_VALUE,
                label: t('person.otherOption'),
                featured: true,
                description: t('person.enterManually'),
            },
        ],
        [cities, t]
    );

    const patch = (partial: Partial<PersonFormData>) => {
        onChange({ ...formData, ...partial });
    };

    const handleCountryChange = (iso2: string) => {
        const country = countries.find((item) => item.iso2 === iso2);
        setStateOverride(null);
        setCityOverride(null);
        patch({
            country_iso_code: iso2,
            country_name: country?.name || '',
            phone_country_code: country?.phoneCode || '',
            state_province_code: '',
            state_province: '',
            city_name: '',
        });
    };

    const handleStateChange = (value: string) => {
        setStateOverride(value);
        setCityOverride(null);
        if (value === LOCATION_OTHER_VALUE) {
            patch({
                state_province_code: '',
                state_province: '',
                city_name: '',
            });
            return;
        }
        const state = states.find((item) => item.iso2 === value);
        patch({
            state_province_code: value,
            state_province: state?.name || '',
            city_name: '',
        });
    };

    const handleCityChange = (value: string) => {
        setCityOverride(value);
        if (value === LOCATION_OTHER_VALUE) {
            patch({ city_name: '' });
            return;
        }
        patch({ city_name: value });
    };

    const showCustomState = stateSelection === LOCATION_OTHER_VALUE;
    const showCustomCity =
        showCustomState || citySelection === LOCATION_OTHER_VALUE;
    const serialLabel = formatSerialNumber(serialNumber);
    const loadingStates = Boolean(
        formData.country_iso_code &&
            statesCache?.country !== formData.country_iso_code
    );
    const loadingCities = Boolean(
        cityKey && citiesCache?.key !== cityKey
    );

    return (
        <>
            {serialLabel && (
                <div className="space-y-1.5">
                    <Label>{t('person.serialNumber')}</Label>
                    <Input value={serialLabel} readOnly disabled />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}_english_name`}>
                        {t('person.englishName')}
                    </Label>
                    <Input
                        id={`${idPrefix}_english_name`}
                        value={formData.english_name}
                        onChange={(e) => patch({ english_name: e.target.value })}
                        placeholder={t('person.englishNamePlaceholder')}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}_urdu_name`}>
                        {t('person.urduName')}
                    </Label>
                    <Input
                        id={`${idPrefix}_urdu_name`}
                        value={formData.urdu_name}
                        onChange={(e) => patch({ urdu_name: e.target.value })}
                        placeholder={t('person.urduNamePlaceholder')}
                        dir="rtl"
                        className="font-urdu"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>{t('person.gender')}</Label>
                <Select
                    value={formData.gender}
                    onValueChange={(v) =>
                        v && patch({ gender: v as Gender })
                    }
                >
                    <SelectTrigger>
                        <SelectValue>{t(`person.${formData.gender}`)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">{t('person.male')}</SelectItem>
                        <SelectItem value="female">{t('person.female')}</SelectItem>
                        <SelectItem value="other">{t('person.other')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}_birth_year`}>
                        {t('person.birthYear')}
                    </Label>
                    <Input
                        id={`${idPrefix}_birth_year`}
                        type="number"
                        value={formData.birth_year ?? ''}
                        onChange={(e) =>
                            patch({
                                birth_year: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        placeholder={t('person.yearPlaceholder')}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}_death_year`}>
                        {t('person.deathYear')}
                    </Label>
                    <Input
                        id={`${idPrefix}_death_year`}
                        type="number"
                        value={formData.death_year ?? ''}
                        onChange={(e) =>
                            patch({
                                death_year: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        placeholder={t('person.yearPlaceholder')}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>{t('person.country')}</Label>
                <SearchableCombobox
                    options={countryOptions}
                    value={formData.country_iso_code}
                    onChange={handleCountryChange}
                    placeholder={
                        countriesLoaded
                            ? t('person.countryPlaceholder')
                            : t('state.loading')
                    }
                    searchPlaceholder={t('person.countrySearch')}
                    noResultsText={t('search.noResults')}
                    disabled={!countriesLoaded}
                />
            </div>

            <div className="space-y-1.5">
                <Label>{t('person.stateProvince')}</Label>
                <SearchableCombobox
                    options={stateOptions}
                    value={stateSelection}
                    onChange={handleStateChange}
                    placeholder={
                        loadingStates
                            ? t('state.loading')
                            : t('person.statePlaceholder')
                    }
                    searchPlaceholder={t('person.stateSearch')}
                    noResultsText={t('search.noResults')}
                    disabled={!formData.country_iso_code || loadingStates}
                    emptyText={t('person.selectCountryFirst')}
                />
                {showCustomState && (
                    <Input
                        value={formData.state_province}
                        onChange={(e) =>
                            patch({
                                state_province_code: '',
                                state_province: e.target.value,
                            })
                        }
                        placeholder={t('person.customStatePlaceholder')}
                        className="mt-1.5"
                    />
                )}
            </div>

            <div className="space-y-1.5">
                <Label>{t('person.city')}</Label>
                {showCustomState ? (
                    <Input
                        value={formData.city_name}
                        onChange={(e) => patch({ city_name: e.target.value })}
                        placeholder={t('person.customCityPlaceholder')}
                        disabled={!formData.state_province}
                    />
                ) : (
                    <>
                        <SearchableCombobox
                            options={cityOptions}
                            value={citySelection}
                            onChange={handleCityChange}
                            placeholder={
                                loadingCities
                                    ? t('state.loading')
                                    : t('person.cityPlaceholder')
                            }
                            searchPlaceholder={t('person.citySearch')}
                            noResultsText={t('search.noResults')}
                            disabled={
                                !formData.state_province_code || loadingCities
                            }
                            emptyText={t('person.selectStateFirst')}
                        />
                        {showCustomCity && (
                            <Input
                                value={formData.city_name}
                                onChange={(e) =>
                                    patch({ city_name: e.target.value })
                                }
                                placeholder={t('person.customCityPlaceholder')}
                                className="mt-1.5"
                            />
                        )}
                    </>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}_phone_code`}>
                    {t('person.countryCode')}
                </Label>
                <Input
                    id={`${idPrefix}_phone_code`}
                    value={formData.phone_country_code}
                    readOnly
                    disabled
                    placeholder={t('person.countryCodeAuto')}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}_nic`}>
                    {t('person.nationalId')}
                </Label>
                <Input
                    id={`${idPrefix}_nic`}
                    value={formData.national_identity_number}
                    onChange={(e) =>
                        patch({ national_identity_number: e.target.value })
                    }
                    placeholder={t('person.nationalIdPlaceholder')}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}_notes`}>{t('person.notes')}</Label>
                <Textarea
                    id={`${idPrefix}_notes`}
                    value={formData.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    rows={3}
                    placeholder={t('person.notes')}
                />
            </div>
        </>
    );
}
