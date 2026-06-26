export interface ResolvedAddress {
    streetName: string;
    number: string;
    neighborhoodName: string;
    cityName: string;
    stateName: string;
    uf: string;
    countryName: string;
    countryCode: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string;
}

type GoogleAddressComponent = {
    long_name: string;
    short_name: string;
    types: string[];
};

function pick(
    components: GoogleAddressComponent[],
    types: string[],
    field: 'long_name' | 'short_name' = 'long_name',
): string {
    for (const type of types) {
        const found = components.find((c) => c.types.includes(type));
        if (found) return found[field];
    }
    return '';
}

export function parseAddressComponents(
    components: GoogleAddressComponent[] | undefined,
    formattedAddress = '',
    location: { lat: number; lng: number } | null = null,
): ResolvedAddress {
    const list = components ?? [];
    return {
        streetName: pick(list, ['route']),
        number: pick(list, ['street_number']),
        neighborhoodName: pick(list, [
            'sublocality_level_1',
            'sublocality',
            'neighborhood',
        ]),
        cityName: pick(list, [
            'administrative_area_level_2',
            'locality',
            'administrative_area_level_3',
        ]),
        stateName: pick(list, ['administrative_area_level_1']),
        uf: pick(list, ['administrative_area_level_1'], 'short_name'),
        countryName: pick(list, ['country']),
        countryCode: pick(list, ['country'], 'short_name'),
        postalCode: pick(list, ['postal_code']),
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        formattedAddress,
    };
}

export function buildFullAddressLine(addr: ResolvedAddress): string {
    if (addr.formattedAddress) return addr.formattedAddress;
    const parts = [
        addr.streetName && addr.number
            ? `${addr.streetName}, ${addr.number}`
            : addr.streetName,
        addr.neighborhoodName,
        addr.cityName && addr.uf
            ? `${addr.cityName}/${addr.uf}`
            : addr.cityName,
        addr.countryName,
    ].filter(Boolean);
    return parts.join(' · ');
}
