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

const optionalNonNegativeNumber = z
    .number()
    .nonnegative('Informe um número válido')
    .optional();

export const interestProfileSchema = z.object({
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    propertyBusinessType: z.enum(BUSINESS_TYPES).optional(),
    minAmount: optionalNonNegativeNumber,
    maxAmount: optionalNonNegativeNumber,
    bedroom: optionalNonNegativeNumber,
    suite: optionalNonNegativeNumber,
    bathroom: optionalNonNegativeNumber,
    carVacancy: optionalNonNegativeNumber,
    totalArea: optionalNonNegativeNumber,
    utilArea: optionalNonNegativeNumber,
    notes: z.string().optional(),
});

export type InterestProfileInput = z.infer<typeof interestProfileSchema>;
