export type GeoResult = { latitude: number; longitude: number };
export type GeoError = 'denied' | 'unavailable';

export function requestUserLocation(): Promise<GeoResult> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject('unavailable' satisfies GeoError);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            () => {
                reject('denied' satisfies GeoError);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    });
}
