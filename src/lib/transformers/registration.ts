import type { ICustomerRegistrationRequest } from '@/types/customer';

/**
 * Common subset both the self-register tab and the lead-capture "create account"
 * path collect. The site only signs up natural persons, so {@link personType} is
 * fixed; address/coordinate fields are optional and come from the map picker.
 */
export interface RegistrationInput {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    naturalPersonDocument?: string;
    whatsapp?: string;
    postalCode?: string;
    streetName?: string;
    number?: string;
    complement?: string;
    latitude?: number | null;
    longitude?: number | null;
    /** Consent to be contacted by the agency → also creates the lead/membership. */
    acceptContact?: boolean;
}

/** Builds the `POST /api/site/register` body. Empty strings collapse to undefined. */
export function toRegistrationRequest(
    input: RegistrationInput,
): ICustomerRegistrationRequest {
    const blankToUndefined = (v?: string | null) => (v ? v : undefined);
    return {
        login: input.email,
        email: input.email,
        password: input.password,
        langKey: 'pt-br',
        customer: {
            name: input.name,
            phoneNumber: input.phoneNumber,
            personType: 'NATURAL_PERSON',
            naturalPersonDocument: blankToUndefined(input.naturalPersonDocument),
            whatsapp: blankToUndefined(input.whatsapp),
            postalCode: blankToUndefined(input.postalCode),
            streetName: blankToUndefined(input.streetName),
            number: blankToUndefined(input.number),
            complement: blankToUndefined(input.complement),
            latitude: input.latitude ?? undefined,
            longitude: input.longitude ?? undefined,
        },
        acceptTerms: true,
        acceptContact: input.acceptContact ?? false,
    };
}
