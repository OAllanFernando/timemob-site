import { z } from 'zod';

import type { PropertyBusinessType, PropertyType } from '@/types/customer';

/**
 * Residential-focused subset exposed in the public site form. The backend
 * enum has 23 values (hotel/industrial/etc.) — we omit the commercial-only
 * options here. Add/remove as the product evolves.
 */
export const PROPERTY_TYPES = [
    'APARTMENT',
    'HOUSE',
    'TWO_STORY_HOUSE',
    'STUDIO',
    'KIT_NET',
    'COVERAGE',
    'LAND',
    'FARM',
    'OTHER',
] as const satisfies readonly PropertyType[];

export const BUSINESS_TYPES = [
    'SALE',
    'RENT',
    'DAILY_RENT',
] as const satisfies readonly PropertyBusinessType[];

// It's a search form: every field is optional. Use `.nullish()` (accepts both `null` and
// `undefined`) so the values the backend returns as JSON `null` round-trip through edit without
// tripping validation — aligning the site's optionality with the backend's nullable columns.
const optionalNonNegativeNumber = z
    .number()
    .nonnegative('Informe um número válido')
    .nullish();

export const interestProfileSchema = z.object({
    propertyType: z.enum(PROPERTY_TYPES).nullish(),
    propertyBusinessType: z.enum(BUSINESS_TYPES).nullish(),
    // Geography is captured from the Google map (never typed) and persisted by NAME — the backend
    // find-or-creates state/city/neighborhood. These are filled by InterestLocationFields.
    neighborhoodName: z.string().nullish(),
    cityName: z.string().nullish(),
    stateName: z.string().nullish(),
    uf: z.string().nullish(),
    countryName: z.string().nullish(),
    countryCode: z.string().nullish(),
    minAmount: optionalNonNegativeNumber,
    maxAmount: optionalNonNegativeNumber,
    bedroom: optionalNonNegativeNumber,
    suite: optionalNonNegativeNumber,
    bathroom: optionalNonNegativeNumber,
    carVacancy: optionalNonNegativeNumber,
    totalArea: optionalNonNegativeNumber,
    utilArea: optionalNonNegativeNumber,
    notes: z.string().nullish(),
    /** Point of interest on the map (signed — Brazil is negative lat/long). Guides the broker. */
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
});

export type InterestProfileInput = z.infer<typeof interestProfileSchema>;
