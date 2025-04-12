export interface Airport {
    iataCode: string;
    airportCity: string;
    airportName: string;
    displayLabel?: string;
    countryCode?: string;
    countryName?: string;
    // Add any other properties your airport objects might have
}