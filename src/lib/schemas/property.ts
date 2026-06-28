import { z } from 'zod';

/**
 * Validation for the agency property-registration form (`/painel/imoveis`). Submits to
 * `/api/site/properties`. Required fields mirror the backend `@NotNull` columns: amount,
 * propertyType, propertyBusinessType, propertyStatus, featured.
 *
 * Kept "pure" (no `z.coerce`, `.transform()`, `.default()`) so the RHF input type matches the
 * output type — number inputs are normalized to `number | undefined` in the form's onChange, and
 * the read-only location fields are filled by the AddressPicker. See timemob-hub AGENTS gotcha #4.
 */

export const PROPERTY_TYPES = [
    'HOUSE',
    'APARTMENT',
    'TWO_STORY_HOUSE',
    'COVERAGE',
    'LAND',
    'COMMERCIAL_ROOM',
    'LAUNCH',
    'UNDER_CONSTRUCTION',
    'ON_PLANT',
    'STUDIO',
    'GARAGE',
    'KIT_NET',
    'FARM',
    'RANCH',
    'WAREHOUSE',
    'OFFICE',
    'SHOPPING_MALL',
    'INDUSTRIAL',
    'HOTEL',
    'BOUTIQUE_HOTEL',
    'PENSION',
    'HOSTEL',
    'OTHER',
] as const;

export const PROPERTY_BUSINESS_TYPES = ['SALE', 'RENT', 'DAILY_RENT'] as const;

export const PROPERTY_STATUSES = [
    'DRAFT',
    'PUBLISHED',
    'HIDDEN',
    'RESERVED',
    'SOLD',
    'RENTED',
    'WAITING_REVISION',
    'DISAPPROVED',
] as const;

export const SOLAR_ORIENTATIONS = [
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST',
    'NORTHEAST',
    'NORTHWEST',
    'SOUTHEAST',
    'SOUTHWEST',
] as const;

export const PROPERTY_POSITIONS = [
    'FRONT',
    'BACK',
    'SIDE',
    'FRONT_SEA_VIEW',
    'SEA_VIEW',
    'OPEN_VIEW',
    'CORNER',
    'INTERNAL',
] as const;

export const propertySchema = z.object({
    // identification & pricing
    title: z.string().optional(),
    description: z.string().optional(),
    amount: z.number({ message: 'Informe o valor' }).positive('O valor deve ser maior que zero'),
    propertyBusinessType: z.enum(PROPERTY_BUSINESS_TYPES, { message: 'Selecione a operação' }),
    propertyType: z.enum(PROPERTY_TYPES, { message: 'Selecione o tipo de imóvel' }),
    propertyStatus: z.enum(PROPERTY_STATUSES, { message: 'Selecione a situação' }),
    featured: z.boolean(),

    // address (free text)
    postalCode: z.string().optional(),
    streetName: z.string().optional(),
    number: z.string().optional(),
    condominium: z.string().optional(),
    tower: z.string().optional(),
    lot: z.string().optional(),
    beachDistance: z.string().optional(),
    solarOrientation: z.enum(SOLAR_ORIENTATIONS).optional(),
    propertyPosition: z.enum(PROPERTY_POSITIONS).optional(),

    // geography filled by the AddressPicker (read-only, by name)
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    neighborhoodName: z.string().optional(),
    cityName: z.string().optional(),
    stateName: z.string().optional(),
    uf: z.string().optional(),
    countryName: z.string().optional(),
    countryCode: z.string().optional(),

    // financials
    condominiumTax: z.number().nonnegative().optional(),
    iptuAmount: z.number().nonnegative().optional(),
    expectedCommissionPercentage: z.number().min(0).max(100).optional(),
    featuredCommissionPercentage: z.number().min(0).max(100).optional(),

    // specs
    bedroom: z.number().int().min(0).optional(),
    suite: z.number().int().min(0).optional(),
    bathroom: z.number().int().min(0).optional(),
    carVacancy: z.number().int().min(0).optional(),
    totalArea: z.number().nonnegative().optional(),
    utilArea: z.number().nonnegative().optional(),
    differentials: z.string().optional(),

    // flags & visit logistics
    exclusive: z.boolean().optional(),
    homeShow: z.boolean().optional(),
    visitResponsibleName: z.string().optional(),
    visitResponsiblePhoneNumber: z.string().optional(),
    expectedVisitDurationMinutes: z.number().positive().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
