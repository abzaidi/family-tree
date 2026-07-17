export interface LocationCountry {
  iso2: string;
  name: string;
  phoneCode: string;
}

export interface LocationState {
  iso2: string;
  name: string;
  countryCode: string;
}

export interface LocationCity {
  name: string;
  stateCode: string;
  countryCode: string;
}

export const LOCATION_OTHER_VALUE = '__other__';
