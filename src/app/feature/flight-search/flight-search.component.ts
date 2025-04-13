import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import { AirPriceParserService } from '../../services/air-price-parser/air-price-parser.service';
import { ModifySearchComponent } from '../modify-search/modify-search.component';
@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    ModifySearchComponent,
  ],
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.css'],
})
export class FlightSearchComponent implements OnInit {
  formData: any = {};
  formType: string = '';
  cardData: any[] = [];
  isLoading = true;
  expandedIndex: number | null = null;
  expanded: boolean = false; // Single flag for expanding section
  onwardFlights: any[] | undefined;
  returnFlights: any[] | undefined;
  selectedLeg = 0; // Default to first leg

  timeFrames = [
    { name: 'Early', timePeriod: '00:00-06:00' },
    { name: 'Morning', timePeriod: '06:00-12:00' },
    { name: 'Afternoon', timePeriod: '12:00-18:00' },
    { name: 'Evening', timePeriod: '08:00-00:00' },
  ];

  getColumnClass(legCount: number): number {
    if (legCount === 2) return 6; // 2 columns (col-6)
    if (legCount === 3) return 4; // 3 columns (col-4)
    if (legCount === 4) return 3; // 4 columns (col-3)
    if (legCount >= 5) return 2; // 5 or more columns (col-2)
    return 12; // Default: full width (col-12)
  }

  selectedIndex: number | null = null;
  selectedRoundTripFlights: any[] = [];
  selectedTrip: 'departure' | 'return' = 'departure';
  selectedMultiCityFlights: any[] = [];
  selectedTab: string = 'flight'; // Default tab is 'Flight Details'

  receivedOneWayFormData: any;
  receivedRoundTripFormData: any;
  receivedMultiCityFormData: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchFormService: SearchFormService,
    private cdr: ChangeDetectorRef,
    private airPriceParser: AirPriceParserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.formData = {
        ...params,
        students: params['students'] || '0',
        armedForces: params['armedForces'] || '0',
        seniorCitizens: params['seniorCitizens'] || '0',
        medicalProfessionals: params['medicalProfessionals'] || '0'
      };
      if (params['legs']) {
        this.formData.legs = JSON.parse(params['legs']);
      }
      this.formType = params['formType'];

      if (this.formType === 'one-way') {
        this.receivedOneWayFormData = this.formData;
        this.handleOneWayResults();
      } else if (this.formType === 'round-trip') {
        this.receivedRoundTripFormData = this.formData;
        this.handleRoundTripResults();
      } else if (this.formType === 'multi-city') {
        this.receivedMultiCityFormData = this.formData;
        this.handleMultiCityResults();
      }
      this.lowFareSearch();
    });
  }

  // UI Methods
  formatToDepartureDate(day: string, time: string): string {
    const date = new Date(day); // this will parse "Fri, Apr 25, 2025"
    const isoDate = date.toISOString().split('T')[0]; // gets "2025-04-25"
    return `${isoDate}T${time}`; // combine with time
  }

  // getFormattedBaggageDetail(baggageArray: string[]): string {
  //   if (!Array.isArray(baggageArray)) return 'N/A';
  
  //   const weight = baggageArray.find((item) => /^[0-9]+k$/i.test(item.trim()));
  //   if (!weight) return 'N/A';
  
  //   const formattedWeight = weight.trim().replace(/k$/i, 'Kgs');
  //   return `${formattedWeight} (1 Piece * ${formattedWeight})`;
  // }
  getFormattedBaggageDetail(baggageTexts: string[]): string {
    if (!Array.isArray(baggageTexts) || baggageTexts.length === 0) return 'N/A';
  
    let pieces: number | null = null;
    let weightInKg: string | null = null;
  
    for (let text of baggageTexts) {
      const trimmed = text.trim();
  
      // Extract piece info like 1P, 2P
      if (pieces === null && /^[0-9]+P$/i.test(trimmed)) {
        const match = trimmed.match(/^([0-9]+)P$/i);
        if (match) {
          pieces = parseInt(match[1], 10);
        }
      }
  
      // Extract weight like 23KG, 25K, 7KG, 8KG etc (prioritize KG/K)
      if (!weightInKg) {
        const kgMatch = trimmed.match(/([0-9]+)(K(G)?)/i);
        if (kgMatch) {
          weightInKg = `${kgMatch[1]}Kgs`;
        }
      }
    }
  
    if (weightInKg) {
      const pcs = pieces !== null ? pieces : 1;
      return `${weightInKg} (${pcs} Piece${pcs > 1 ? 's' : ''} * ${weightInKg})`;
    }
  
    return 'N/A';
  }    
  
  getTotalPiecesAllowed(checked: string[], carryOn: string[]): string {
    let totalPieces = 0;
  
    const extractPieces = (baggageArray: string[]) => {
      if (!Array.isArray(baggageArray)) return;
  
      let foundPiece = false;
      let foundWeight = false;
  
      for (const text of baggageArray) {
        const cleanText = text.trim().toUpperCase();
  
        // Match "1P", "2P", etc.
        const pieceMatch = cleanText.match(/^([0-9]+)\s*P$/);
        if (pieceMatch) {
          totalPieces += parseInt(pieceMatch[1], 10);
          foundPiece = true;
        }
  
        // Match "7K", "23KG", etc.
        const weightMatch = cleanText.match(/([0-9]+)(K(G)?)?/);
        if (weightMatch) {
          foundWeight = true;
        }
      }
  
      // If no "pieces" found but weight exists, assume 1 piece
      if (!foundPiece && foundWeight) {
        totalPieces += 1;
      }
    };
  
    extractPieces(checked);
    extractPieces(carryOn);
  
    return totalPieces > 0 ? `${totalPieces} Bag${totalPieces > 1 ? 's' : ''} Allowed` : 'N/A';
  }     
  
  toggleDetails(index: number, e: any): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;

    if (this.expandedIndex === index) {
      const flights = (e.flights || [e]).map((flight: any) => {
        const departureDate = this.formatToDepartureDate(
          flight.departure_day ||
            this.formatDateTime(flight.departureTime).date,
          flight.departure_time ||
            this.formatDateTime(flight.departureTime).time
        );

        return {
          flightKey: flight.key,
          origin: flight.origin || flight.departure || '',
          destination: flight.destination || flight.arrival || '',
          departureDate: departureDate,
          carrier: flight.airline,
          flightNumber: flight.flightNumber,
          providerCode: flight.providerCode,
        };
      });

      const formData = {
        flights,
        adults: 1,
        children: 0,
        infants: 0,
        students: 0,
        seniors: 0,
      };

      this.searchFormService.getAirPrice(formData).subscribe({
        next: (response) => {
          const parser = new DOMParser();
          const xmlString = response as string;
          const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
          
          const parsed = this.airPriceParser.parseAirPriceXML(
            response as string
          );
          if (this.cardData && this.cardData[index]) {
            this.cardData[index].baggageChecked = parsed.baggageInfo.checked;
            this.cardData[index].baggageCarryOn = parsed.baggageInfo.carryOn;
            this.cardData[index].refundability = parsed.refundability;
          }
          console.log('Air Price response:', response);
        },
        error: (error) => {
          console.error('Error fetching air price:', error);
        },
      });
    }
  }

  toggleSelectedRoundTripDetails(): void {
    this.expanded = !this.expanded;
  }

  closeExpandedSection(): void {
    this.expanded = false;
  }

  selectButton(index: number): void {
    this.selectedIndex = index;
  }

  toggleSelectRoundTrip(index: number, tripType: 'departure' | 'return') {
    if (tripType === 'departure' && this.onwardFlights) {
      const selectedFlight = this.onwardFlights[index];

      if (selectedFlight.isSelected) {
        // Deselect if already selected
        selectedFlight.isSelected = false;
        this.selectedRoundTripFlights = [
          null,
          this.selectedRoundTripFlights?.[1] || null,
        ].filter(Boolean);
      } else {
        // Deselect all first
        this.onwardFlights.forEach((flight) => (flight.isSelected = false));
        selectedFlight.isSelected = true;

        this.selectedRoundTripFlights = [
          selectedFlight,
          this.selectedRoundTripFlights?.[1] || null,
        ].filter(Boolean);
      }
    } else if (tripType === 'return' && this.returnFlights) {
      const selectedFlight = this.returnFlights[index];

      if (selectedFlight.isSelected) {
        // Deselect if already selected
        selectedFlight.isSelected = false;
        this.selectedRoundTripFlights = [
          this.selectedRoundTripFlights?.[0] || null,
          null,
        ].filter(Boolean);
      } else {
        // Deselect all first
        this.returnFlights.forEach((flight) => (flight.isSelected = false));
        selectedFlight.isSelected = true;

        this.selectedRoundTripFlights = [
          this.selectedRoundTripFlights?.[0] || null,
          selectedFlight,
        ].filter(Boolean);
      }
    }
  }

  getTotalSelectedRoundTripPrice(): number {
    return this.selectedRoundTripFlights
      .filter((flight) => flight) // Ensure we don't include null values
      .reduce((total, flight) => total + Number(flight.price) || 0, 0);
  }
  isSelectedMultiCityDetailsExpanded: boolean = false;

  toggleSelectedMultiCityDetails() {
    this.isSelectedMultiCityDetailsExpanded =
      !this.isSelectedMultiCityDetailsExpanded;
  }
  toggleSelectMultiCity(index: number) {
    const selectedFlight = this.cardData[this.selectedLeg].flights[index];

    const isAlreadySelected = selectedFlight.isSelected;

    if (isAlreadySelected) {
      // Deselect this flight
      selectedFlight.isSelected = false;

      // Remove from selectedMultiCityFlights
      this.selectedMultiCityFlights = this.selectedMultiCityFlights.filter(
        (flight) => !(flight.leg === this.selectedLeg)
      );
    } else {
      // Deselect all flights in this leg
      this.cardData[this.selectedLeg].flights.forEach(
        (flight: { isSelected: boolean }) => (flight.isSelected = false)
      );

      // Mark new selection
      selectedFlight.isSelected = true;

      // Check if a flight for this leg already exists
      const existingIndex = this.selectedMultiCityFlights.findIndex(
        (flight) => flight.leg === this.selectedLeg
      );

      if (existingIndex !== -1) {
        // Replace the old selection
        this.selectedMultiCityFlights[existingIndex] = {
          ...selectedFlight,
          leg: this.selectedLeg,
        };
      } else {
        if (this.selectedMultiCityFlights.length < this.cardData.length) {
          this.selectedMultiCityFlights.push({
            ...selectedFlight,
            leg: this.selectedLeg,
          });
        } else {
          alert(
            `You can only select ${this.cardData.length} flights in total!`
          );
          return;
        }
      }
    }
  }
  get totalSelectedMulticityFlightPrice(): number {
    return this.selectedMultiCityFlights.reduce(
      (sum, flight) => sum + Number(flight.price),
      0
    );
  }
  closeisSelectedMultiCityDetailsExpandedSection(): void {
    this.isSelectedMultiCityDetailsExpanded = false;
  }

  // ---------------- Search & Timing Helpers ----------------
  lowFareSearch() {
    let origin: string, destination: string;
    if (this.formType === 'one-way' || this.formType === 'round-trip') {
      origin = this.formData.origin;
      destination = this.formData.destination;
    } else if (this.formType === 'multi-city') {
      if (this.formData.legs && this.formData.legs.length > 0) {
        origin = this.formData.legs[0].origin;
        destination = this.formData.legs[0].destination;
      }
    }
    this.searchFormService.getAllLowCostCarrier(this.formData).subscribe(
      (res: any) => {
        console.log(`${this.formType} LCC result:`, res, this.formData);
        if (res) {
          setTimeout(() => {
            this.isLoading = false;
          }, 3000);
        }
        if (this.formType === 'one-way') {
          setTimeout(() => {
            this.isLoading = false;
          }, 3000);
          this.handleXMLResponse(res, origin, destination);
        } else if (
          this.formType === 'round-trip' ||
          this.formType === 'multi-city'
        ) {
          setTimeout(() => {
            this.isLoading = false;
          }, 3000);
          this.handleXMLResponse1(res, this.formData);
        }
      },
      (error) => {
        console.error(`Error fetching ${this.formType} data:`, error);
      }
    );
  }

  calculateDuration(
    departureTime: string,
    arrivalTime: string,
    departureDay: string,
    arrivalDay: string
  ): string {
    const parseDate = (day: string, time: string): Date | null => {
      try {
        const formattedDate = new Date(`${day} ${time}`);
        return isNaN(formattedDate.getTime()) ? null : formattedDate;
      } catch {
        return null;
      }
    };
    const departureDateTime = parseDate(departureDay, departureTime);
    const arrivalDateTime = parseDate(arrivalDay, arrivalTime);
    if (!departureDateTime || !arrivalDateTime) return 'Invalid time format';
    const diffInMs = arrivalDateTime.getTime() - departureDateTime.getTime();
    if (diffInMs < 0) return 'Invalid time calculation';
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const isNextDay = arrivalDateTime.getDate() > departureDateTime.getDate();
    return `${hours}h ${minutes}m${isNextDay ? '+1' : ''}`;
  }

  getLayoverText(layovers: { [key: string]: number }): string {
    if (!layovers || Object.keys(layovers).length === 0) return 'No layover';
    const [airport, minutes] = Object.entries(layovers)[0];
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${airport} - ${hours} hrs ${mins} mins Layover`;
  }

  private buildSegmentPriceMap(
    airPricePointElements: Element[]
  ): Map<
    string,
    {
      totalPrice: string;
      basePrice: string;
      taxes: string;
      bookingCode: string;
    }[]
  > {
    const segmentPriceMap = new Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >();

    airPricePointElements.forEach((pricePoint) => {
      const airPricingInfos = Array.from(
        pricePoint.getElementsByTagName('air:AirPricingInfo')
      );

      airPricingInfos.forEach((api) => {
        const totalPrice = api.getAttribute('TotalPrice') || '0';
        const basePrice = api.getAttribute('BasePrice') || '0';
        const taxes = api.getAttribute('Taxes') || '0';

        const bookingInfos = Array.from(
          api.getElementsByTagName('air:BookingInfo')
        );

        bookingInfos.forEach((bi) => {
          const segRef = bi.getAttribute('SegmentRef');
          const bookingCode = bi.getAttribute('BookingCode') || '';

          if (segRef) {
            const entry = { totalPrice, basePrice, taxes, bookingCode };
            const existing = segmentPriceMap.get(segRef) || [];
            existing.push(entry);

            // Sort by numeric value of totalPrice (e.g., remove currency and sort)
            existing.sort((a, b) => {
              const numA = parseFloat(a.totalPrice.replace(/[^\d.]/g, ''));
              const numB = parseFloat(b.totalPrice.replace(/[^\d.]/g, ''));
              return numA - numB;
            });

            segmentPriceMap.set(segRef, existing);
          }
        });
      });
    });

    return segmentPriceMap;
  }

  private extractFlights(
    pricingMap: Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >,
    segments: Element[],
    flightDetails: Element[]
  ): any[] {
    const flights = [];

    // Build a map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Build a map of segments by Key
    const segmentMap = new Map<string, Element>();
    for (const segment of segments) {
      const key = segment.getAttribute('Key');
      if (key) segmentMap.set(key, segment);
    }

    // Now iterate over pricingMap entries (which are the flight keys)
    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue; // Skip if no matching segment found
      const carrier = segment.getAttribute('Carrier') || '';
      const flightNumber = segment.getAttribute('FlightNumber') || '';
      const airAvailInfo = segment.querySelector('AirAvailInfo');
      const providerCode = airAvailInfo
        ? airAvailInfo.getAttribute('ProviderCode') || 'Unknown Provider Code'
        : 'Unknown Provider Code';
      const flightDetailsRef = segment.getElementsByTagName(
        'air:FlightDetailsRef'
      )[0];
      const flightDetailsKey = flightDetailsRef?.getAttribute('Key') || '';
      const flight = flightDetailsMap.get(flightDetailsKey);
      const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
      const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
      const basePriceStr = priceInfo.basePrice?.replace(/[^\d.]/g, '');
      const taxesStr = priceInfo.taxes?.replace(/[^\d.]/g, '');

      flights.push({
        key: segKey,
        origin: flight?.getAttribute('Origin') || '',
        destination: flight?.getAttribute('Destination') || '',
        departureTime: new Date(flight?.getAttribute('DepartureTime') || ''),
        arrivalTime: new Date(flight?.getAttribute('ArrivalTime') || ''),
        flightTime: parseInt(flight?.getAttribute('FlightTime') || '0', 10),
        equipment: flight?.getAttribute('Equipment') || '',
        originTerminal: flight?.getAttribute('OriginTerminal') || 'N/A',
        destinationTerminal:
          flight?.getAttribute('DestinationTerminal') || 'N/A',
        price: priceStr ? `${Math.floor(parseFloat(priceStr))}` : '0',
        basePrice: basePriceStr
          ? `${Math.floor(parseFloat(basePriceStr))}`
          : '0',
        taxes: taxesStr ? `${Math.floor(parseFloat(taxesStr))}` : '0',
        priceArray: priceArray,
        airline: carrier,
        providerCode: providerCode,
        flightNumber: flightNumber,
      });
    }

    return flights;
  }

  private extractSeatsInfoFromPricePoint(
    airPricePointElements: Element[]
  ): Map<string, string> {
    const seatsMap = new Map<string, string>();
    airPricePointElements.forEach((pricePoint) => {
      const airPricingInfos = Array.from(
        pricePoint.getElementsByTagName('air:AirPricingInfo')
      );
      airPricingInfos.forEach((api) => {
        const bookingInfos = Array.from(
          api.getElementsByTagName('air:BookingInfo')
        );
        bookingInfos.forEach((bi) => {
          const bookingCount = bi.getAttribute('BookingCount');
          const segRef = bi.getAttribute('SegmentRef') || '';
          if (bookingCount) {
            const availableSeats = `${bookingCount}`;
            seatsMap.set(segRef, availableSeats); // Map the price point key to seats info
          }
        });
      });
    });
    return seatsMap;
  }

  // Process direct flight segments using a filter function.
  private processDirectFlights(
    pricingMap: Map<
      string,
      {
        totalPrice: string;
        basePrice: string;
        taxes: string;
        bookingCode: string;
      }[]
    >,
    seatsMap: Map<string, string>,
    segments: Element[],
    flightDetails: Element[],
    fareInfoElements: Element[],
    filterFn: (origin: string, destination: string) => boolean,
    type: string
  ): any[] {
    const flights = [];

    // Create a Map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Create a Map of AirSegments by Key
    const segmentMap = new Map<string, Element>();
    for (const segment of segments) {
      const key = segment.getAttribute('Key');
      if (key) segmentMap.set(key, segment);
    }

    // Iterate over pricingMap (not segments)
    for (const [segKey, priceArray] of pricingMap.entries()) {
      const segment = segmentMap.get(segKey);
      if (!segment) continue; // Skip if segment not found
      const flightNumber =
        segment.getAttribute('FlightNumber') || 'Unknown Flight Number';
      const airAvailInfo = segment.querySelector('AirAvailInfo');
      const providerCode = airAvailInfo
        ? airAvailInfo.getAttribute('ProviderCode') || 'Unknown Provider Code'
        : 'Unknown Provider Code';

      const airline = segment.getAttribute('Carrier') || 'Unknown Airline';
      const departure = segment.getAttribute('Origin') || 'N/A';
      const arrival = segment.getAttribute('Destination') || 'N/A';
      const departureTime = segment.getAttribute('DepartureTime') || 'N/A';
      const arrivalTime = segment.getAttribute('ArrivalTime') || 'N/A';
      const seatsLeft = seatsMap.get(segKey) || 'N/A';

      // Get prices
      const priceInfo = Array.isArray(priceArray) ? priceArray[0] : priceArray;
      const priceStr = priceInfo.totalPrice?.replace(/[^\d.]/g, '');
      const basePriceStr = priceInfo.basePrice?.replace(/[^\d.]/g, '');
      const taxesStr = priceInfo.taxes?.replace(/[^\d.]/g, '');

      // Get flight detail ref key
      const flightDetailsRef = segment.getElementsByTagName(
        'air:FlightDetailsRef'
      )[0];
      const flightDetailsKey = flightDetailsRef?.getAttribute('Key') || '';
      const flightDetail = flightDetailsMap.get(flightDetailsKey);

      const flightOrigin = flightDetail?.getAttribute('Origin') || 'N/A';
      const flightDestination =
        flightDetail?.getAttribute('Destination') || 'N/A';

      if (filterFn(flightOrigin, flightDestination)) {
        flights.push({
          key: segKey,
          logo: `../../../assets/images/${airline.toLowerCase()}.svg`,
          flight_img: '../../../assets/svgs/la_plane.svg',
          departure,
          departure_time: this.formatDateTime(departureTime).time,
          departure_day: this.formatDateTime(departureTime).date,
          arrival_time: this.formatDateTime(arrivalTime).time,
          arrival_day: this.formatDateTime(arrivalTime).date,
          arrival,
          price: priceStr ? `${Math.floor(parseFloat(priceStr))}` : '0',
          basePrice: basePriceStr
            ? `${Math.floor(parseFloat(basePriceStr))}`
            : '0',
          taxes: taxesStr ? `${Math.floor(parseFloat(taxesStr))}` : '0',
          formattedPrice: priceStr
            ? `${Math.floor(parseFloat(priceStr))}`
            : '0',
          originTerminal: flightDetail?.getAttribute('OriginTerminal') || 'N/A',
          destinationTerminal:
            flightDetail?.getAttribute('DestinationTerminal') || 'N/A',
          seatsLeft,
          airline,
          isSelected: false,
          type,
          priceArray: priceArray,
          providerCode: providerCode,
          flightNumber: flightNumber,
        });
      }
    }

    return flights;
  }

  // Process connecting routes by summing prices of individual segments.
  private processConnectingRoutes(
    routes: any[],
    seatsMap: Map<string, string>,
    segments: Element[],
    flightDetails: Element[],
    type: string
  ): any[] {
    // Create a map of FlightDetails by Key
    const flightDetailsMap = new Map<string, Element>();
    for (const detail of flightDetails) {
      const key = detail.getAttribute('Key');
      if (key) flightDetailsMap.set(key, detail);
    }

    // Create a map of AirSegments by Key
    const airSegmentMap = new Map<string, Element>();
    for (const seg of segments) {
      const key = seg.getAttribute('Key');
      if (key) airSegmentMap.set(key, seg);
    }

    return routes.map((route) => {
      const firstFlight = route.flights[0];
      const lastFlight = route.flights[route.flights.length - 1];

      const totalPrice = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.price || '0'),
        0
      );
      const totalBasePrice = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.basePrice || '0'),
        0
      );
      const totalTaxes = route.flights.reduce(
        (sum: number, flight: any) => sum + parseFloat(flight.taxes || '0'),
        0
      );
      const flightsWithSeats = route.flights.map((flight: any) => {
        const seats = parseInt(seatsMap.get(flight.key) || '0', 10);
        return {
          ...flight,
          seatsLeft: seats,
        };
      });
      const minSeatsLeft = Math.min(
        ...flightsWithSeats.map((flight: any) => flight.seatsLeft)
      );

      const flightsWithDetails = route.flights.map((flight: any) => {
        const segment = airSegmentMap.get(flight.key);
        const flightDetailsRef = segment?.getElementsByTagName(
          'air:FlightDetailsRef'
        )[0];
        const flightDetailKey = flightDetailsRef?.getAttribute('Key') || '';
        const detail = flightDetailsMap.get(flightDetailKey);

        return {
          ...flight,
          origin: detail?.getAttribute('Origin') || flight.origin || 'N/A',
          destination:
            detail?.getAttribute('Destination') || flight.destination || 'N/A',
          originTerminal: detail?.getAttribute('OriginTerminal') || 'N/A',
          destinationTerminal:
            detail?.getAttribute('DestinationTerminal') || 'N/A',
          departureTime:
            segment?.getAttribute('DepartureTime') || flight.departureTime,
          arrivalTime:
            segment?.getAttribute('ArrivalTime') || flight.arrivalTime,
          flightTime:
            detail?.getAttribute('FlightTime') || flight.flightTime || '0',
          equipment:
            detail?.getAttribute('Equipment') || flight.equipment || '',
          seatsLeft: seatsMap.get(flight.key) || 'N/A',
        };
      });

      return {
        flights: flightsWithSeats,
        totalTravelTime: route.totalTravelTime,
        totalStops: route.totalStops,
        departure: firstFlight.origin,
        departure_time: this.formatDateTime(firstFlight.departureTime).time,
        departure_day: this.formatDateTime(firstFlight.departureTime).date,
        arrival: lastFlight.destination,
        arrival_time: this.formatDateTime(lastFlight.arrivalTime).time,
        arrival_day: this.formatDateTime(lastFlight.arrivalTime).date,
        layovers: route.layovers,
        price: totalPrice.toFixed(2),
        basePrice: totalBasePrice.toFixed(2),
        taxes: totalTaxes.toFixed(2),
        formattedPrice: `${Math.floor(totalPrice)}`,
        airlines: route.flights.map((f: any) => f.airline).join(' '),
        flight_img: '../../../assets/svgs/la_plane.svg',
        isSelected: false,
        type,
        seatsLeft: minSeatsLeft,
        providerCode: firstFlight.providerCode,
        airline: firstFlight.airline,
        flightNumber: flightsWithSeats
          .map((f: any) => f.flightNumber)
          .join(','),
      };
    });
  }

  // ----------------- Handlers for Search Results -----------------
  handleOneWayResults() {
    console.log('Processing one-way flight search with:', this.formData);
    // Add any one-way specific logic here
  }

  handleRoundTripResults() {
    console.log('Processing round-trip flight search with:', this.formData);
    // Add any round-trip specific logic here
  }

  handleMultiCityResults() {
    console.log('Processing multi-city flight search with:', this.formData);
    // Add any multi-city specific logic here
  }

  // Optimized XML handler for one-way flights (direct + connecting)
  handleXMLResponse(response: string, origin: string, destination: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response, 'application/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parsing XML');
      return;
    }
    // Build pricing map using AirPricePoint elements.
    const airPricePointElements = Array.from(
      xmlDoc.getElementsByTagName('air:AirPricePoint')
    );
    const pricingMap = this.buildSegmentPriceMap(airPricePointElements);
    const seatsMap = this.extractSeatsInfoFromPricePoint(airPricePointElements);
    const airSegments = Array.from(
      xmlDoc.getElementsByTagName('air:AirSegment')
    );
    const airFlightDetails = Array.from(
      xmlDoc.getElementsByTagName('air:FlightDetails')
    );
    const fareInfoElements = Array.from(
      xmlDoc.getElementsByTagName('air:FareInfo')
    );

    const flightsFromDetails = this.extractFlights(
      pricingMap,
      airSegments,
      airFlightDetails
    );
    const connectingRoutes = this.findConnectingFlights(
      flightsFromDetails,
      origin,
      destination
    );

    const directFlights = this.processDirectFlights(
      pricingMap,
      seatsMap,
      airSegments,
      airFlightDetails,
      fareInfoElements,
      (flightOrigin: string, flightDestination: string) =>
        flightOrigin === origin && flightDestination === destination,
      'direct'
    ).map((flight) => ({
      ...flight,
      // baggage: baggageInfoMap.get(flight.key) || 'No Baggage Info',
    }));

    const connectingFlights = this.processConnectingRoutes(
      connectingRoutes,
      seatsMap,
      airSegments,
      airFlightDetails,
      'connecting'
    ).map((flight) => ({
      ...flight,
      // baggage: baggageInfoMap.get(flight.flights[0]?.key) || 'No Baggage Info',
    }));

    this.cardData = [...directFlights, ...connectingFlights];
    console.log(this.cardData, 'All Flights Data (Direct + Connecting)');
  }

  // Optimized XML handler for round-trip/multi-city (onward & return)
  handleXMLResponse1(response: string, requestData: any) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response, 'application/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parsing XML');
      return;
    }
    // For round-trip/multi-city, use namespace for AirSegment.
    const airSegments = Array.from(
      xmlDoc.getElementsByTagNameNS('*', 'AirSegment')
    );
    const airFlightDetails = Array.from(
      xmlDoc.getElementsByTagName('air:FlightDetails')
    );
    const fareInfoElements = Array.from(
      xmlDoc.getElementsByTagName('air:FareInfo')
    );
    // Build pricing map.
    const airPricePointElements = Array.from(
      xmlDoc.getElementsByTagName('air:AirPricePoint')
    );
    const pricingMap = this.buildSegmentPriceMap(airPricePointElements);
    const seatsMap = this.extractSeatsInfoFromPricePoint(airPricePointElements);

    this.cardData = []; // Reset previous data

    if (requestData.formType === 'round-trip') {
      // Round Trip Logic
      this.onwardFlights = [];
      this.returnFlights = [];
      const { origin, destination } = requestData;
      const flightsFromDetails = this.extractFlights(
        pricingMap,
        airSegments,
        airFlightDetails
      );
      const onwardRoutes = this.findConnectingFlights(
        flightsFromDetails,
        origin,
        destination
      );
      const returnRoutes = this.findConnectingFlights(
        flightsFromDetails,
        destination,
        origin
      );

      const directOnwardFlights = this.processDirectFlights(
        pricingMap,
        seatsMap,
        airSegments,
        airFlightDetails,
        fareInfoElements,
        (flightOrigin: string, flightDestination: string) =>
          flightOrigin === origin && flightDestination === destination,
        'direct'
      );

      const directReturnFlights = this.processDirectFlights(
        pricingMap,
        seatsMap,
        airSegments,
        airFlightDetails,
        fareInfoElements,
        (flightOrigin: string, flightDestination: string) =>
          flightOrigin === destination && flightDestination === origin,
        'direct-return'
      );

      const connectingOnwardFlights = this.processConnectingRoutes(
        onwardRoutes,
        seatsMap,
        airSegments,
        airFlightDetails,

        'connecting'
      );
      const connectingReturnFlights = this.processConnectingRoutes(
        returnRoutes,
        seatsMap,
        airSegments,
        airFlightDetails,

        'connecting-return'
      );

      this.onwardFlights = [...directOnwardFlights, ...connectingOnwardFlights];
      this.returnFlights = [...directReturnFlights, ...connectingReturnFlights];
      if (this.onwardFlights.length > 0 && this.returnFlights.length > 0) {
        this.cardData = [
          {
            departure: this.onwardFlights[0].departure,
            arrival: this.onwardFlights[0].arrival,
            departure_day: this.onwardFlights[0].departure_day,
            return_day: this.returnFlights[0].departure_day,
          },
        ];
      }
      console.log('Round Trip Onward Flights:', this.onwardFlights);
      console.log('Round Trip Return Flights:', this.returnFlights);
    } else if (requestData.formType === 'multi-city') {
      // Multi-City Logic: Process each leg separately
      this.receivedMultiCityFormData = []; // Reset multi-city data
      for (let i = 0; i < requestData.legs.length; i++) {
        const { origin, destination } = requestData.legs[i];
        const directFlights = this.processDirectFlights(
          pricingMap,
          seatsMap,
          airSegments,
          airFlightDetails,
          fareInfoElements,
          (flightOrigin: string, flightDestination: string) =>
            flightOrigin === origin && flightDestination === destination,
          `multi-city-leg-${i + 1}`
        ).map((flight) => ({ ...flight, type: 'direct' }));

        const flightsFromDetails = this.extractFlights(
          pricingMap,
          airSegments,
          airFlightDetails
        );
        const connectingRoutes = this.findConnectingFlights(
          flightsFromDetails,
          origin,
          destination
        );
        const connectingFlights = this.processConnectingRoutes(
          connectingRoutes,
          seatsMap,
          airSegments,
          airFlightDetails,
          `multi-city-leg-${i + 1}`
        ).map((flight) => ({ ...flight, type: 'connecting' }));

        this.receivedMultiCityFormData.push({
          leg: i + 1,
          origin,
          destination,
          flights: [...directFlights, ...connectingFlights],
        });

        this.cardData = requestData.legs.map(
          (
            leg: { origin: any; destination: any; fromDate: any },
            index: string | number
          ) => ({
            id: index,
            departure: leg.origin,
            arrival: leg.destination,
            departure_day: leg.fromDate || 'N/A',
            flights: this.receivedMultiCityFormData[index]?.flights || [],
          })
        );
      }
      console.log('Multi-City Flights:', this.receivedMultiCityFormData);
    }
  }

  // ---------------- Helper to Format Date & Time ----------------
  formatDateTime(dateTime: string | Date): { time: string; date: string } {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return { time, date: formattedDate };
  }

  // ---------------- Recursively Search for Connecting Flights ----------------
  findConnectingFlights(flights: any[], origin: string, destination: string) {
    const routes: any[] = [];
    function findRoute(currentRoute: any[], lastArrivalTime: Date) {
      const lastFlight = currentRoute[currentRoute.length - 1];
      const nextFlights = flights.filter(
        (f) =>
          f.origin === lastFlight.destination &&
          f.arrivalTime > lastArrivalTime &&
          (f.departureTime.getTime() - lastFlight.arrivalTime.getTime()) /
            (1000 * 60) >=
            30 &&
          (f.departureTime.getTime() - lastFlight.arrivalTime.getTime()) /
            (1000 * 60) <=
            300
      );
      for (const nextFlight of nextFlights) {
        const newRoute = [...currentRoute, nextFlight];
        if (nextFlight.destination === destination) {
          let totalTravelTime = 0;
          const layoverDetails: Record<string, number> = {};
          for (let i = 0; i < newRoute.length; i++) {
            totalTravelTime += newRoute[i].flightTime;
            if (i > 0) {
              const layover =
                (newRoute[i].departureTime.getTime() -
                  newRoute[i - 1].arrivalTime.getTime()) /
                (1000 * 60);
              layoverDetails[newRoute[i - 1].destination] = layover;
              totalTravelTime += layover;
            }
          }
          routes.push({
            flights: newRoute,
            totalTravelTime,
            totalStops: newRoute.length - 1,
            originalOrigin: origin,
            originalDestination: destination,
            layovers: layoverDetails,
          });
        } else {
          findRoute(newRoute, nextFlight.arrivalTime);
        }
      }
    }
    const initialFlights = flights.filter((f) => f.origin === origin);
    for (const flight of initialFlights) {
      findRoute([flight], flight.arrivalTime);
    }
    routes.sort((a, b) => a.totalTravelTime - b.totalTravelTime);
    return routes;
  }
}
