import { Component, OnInit } from '@angular/core';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Options } from '@angular-slider/ngx-slider';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  FormArray
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';
import { AppCarouselComponent } from '../../pages/components/app-carousel/app-carousel.component';
import { AppFlightTypeTabsComponent } from '../../pages/components/app-flight-type-tabs/app-flight-type-tabs.component';
import { AppCommonFlightFieldsComponent } from '../../pages/components/app-common-flight-fields/app-common-flight-fields.component';
import { AppMultiCityFieldsComponent } from '../../pages/components/app-multi-city-fields/app-multi-city-fields.component';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgxSliderModule,
    NgSelectModule,
    NgIf,
    AppCarouselComponent,
    AppFlightTypeTabsComponent,
    AppCommonFlightFieldsComponent,
    AppMultiCityFieldsComponent
  ],
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.css'],
})
export class SearchFormComponent implements OnInit {
  // Dates and search subject
  today: string = new Date().toISOString().split('T')[0];
  minToDate: string = this.today;
  searchInput$ = new Subject<string>();

  // Form flags for the booking modes
  oneWayForm: boolean = true;
  roundTripForm: boolean = false;
  multiCityForm: boolean = false;
  groupFareForm: boolean = false; // (currently not enabled)

  activeTab: string = 'oneWay'; // default tab name
  activeFlightIndex: number = 0; // For multi-city flight tab

  // Passenger counts for both mobile and desktop views
  passengerCounts = {
    adult: 1,
    child: 0,
    infant: 0,
  };

  // Form Groups
  oneWayFormData!: FormGroup;
  roundTripFormData!: FormGroup;
  multiCityFormData!: FormGroup;

  // List of Airports loaded from the service
  listOfAirports: any[] = [];

  // Flag to avoid cyclic updates between One Way and Round Trip forms
  isUpdating: boolean = false;

  // Slider options for One Way and Round Trip
  onewayValue: number = 1;
  onewayOptions: Options = {
    floor: 1,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  onewayValue1: number = 0;
  onewayOptions1: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  onewayValue2: number = 0;
  onewayOptions2: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  // Slider options for Round Trip
  roundtripValue: number = 1;
  roundtripOptions: Options = {
    floor: 1,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  roundtripValue1: number = 0;
  roundtripOptions1: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  roundtripValue2: number = 0;
  roundtripOptions2: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  // Slider options for Multi-City
  multicityValue: number = 3;
  multicityOptions: Options = {
    floor: 1,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  multicityValue1: number = 0;
  multicityOptions1: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  multicityValue2: number = 0;
  multicityOptions2: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
    getPointerColor: () => 'var(--primary)',
    getSelectionBarColor: () => 'var(--primary)',
  };

  // Modal Alert Message for validation
  modalMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private searchFormService: SearchFormService,
    private router: Router
  ) { }

  // Update minimum return date based on departure
  updateMinToDate(): void {
    const fromDate = this.roundTripFormData.get('fromDate')?.value;
    this.minToDate = fromDate ? fromDate : this.today;
  }

  // Load airports list, mapping each airport to include a displayLabel
  loadAirports(query: string): void {
    this.searchFormService.getAirports(query).subscribe(
      (data) => {
        this.listOfAirports = data.map(airport => ({
          ...airport,
          displayLabel: `${airport.iataCode} - ${airport.airportCity}`
        }));
      },
      (error) => {
        console.error('Error loading airports', error);
      }
    );
  }

  // Handle airport selection for One Way and Round Trip forms
  selectAirport(event: any, field: string): void {
    if (!event || !event.iataCode) return;
    const selectedCode = event.iataCode;

    // Update both forms
    if (field === 'origin') {
      this.oneWayFormData.patchValue({ origin: selectedCode });
      this.roundTripFormData.patchValue({ origin: selectedCode });
    } else if (field === 'destination') {
      this.oneWayFormData.patchValue({ destination: selectedCode });
      this.roundTripFormData.patchValue({ destination: selectedCode });
    }

    // Validate: "From" and "To" cannot be the same for One Way
    const oneWayOrigin = this.oneWayFormData.value.origin;
    const oneWayDestination = this.oneWayFormData.value.destination;
    if (oneWayOrigin && oneWayDestination && oneWayOrigin === oneWayDestination) {
      alert(`The "From" and "To" fields for One Way cannot be the same.`);
      this.oneWayFormData.patchValue({ [field]: '' });
    }

    // Validate for Round Trip form as well
    const roundTripOrigin = this.roundTripFormData.value.origin;
    const roundTripDestination = this.roundTripFormData.value.destination;
    if (roundTripOrigin && roundTripDestination && roundTripOrigin === roundTripDestination) {
      alert(`The "From" and "To" fields for Round Trip cannot be the same.`);
      this.roundTripFormData.patchValue({ [field]: '' });
    }
  }

  // Handle airport selection for Multi-City form
  selectAirport2(event: any, field: string): void {
    if (!event || !event.iataCode) return;
    const selectedCode = event.iataCode;

    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    const currentLeg = legsArray.at(this.activeFlightIndex) as FormGroup;

    // Patch the selected airport
    currentLeg.patchValue({ [field]: selectedCode });

    // Validate the current leg: origin and destination must differ
    const currentLegValues = currentLeg.value;
    if (
      currentLegValues.origin &&
      currentLegValues.destination &&
      currentLegValues.origin === currentLegValues.destination
    ) {
      alert(`The "From" and "To" fields in leg ${this.activeFlightIndex + 1} cannot be the same.`);
      currentLeg.patchValue({ [field]: '' });
      return;
    }
  }

  // Swap origin and destination (used by the common flight fields component)
  swapSelection(): void {
    if (this.oneWayFormData) {
      const origin = this.oneWayFormData.get('origin')!.value;
      const destination = this.oneWayFormData.get('destination')!.value;
      this.oneWayFormData.patchValue({
        origin: destination,
        destination: origin
      });
    }
  }

  // --- Multi-City form helpers ---

  // Getter to access legs as a FormArray
  get legs(): FormArray {
    return this.multiCityFormData.get('legs') as FormArray;
  }

  // Create a new leg form group for Multi-City booking
  createLegFormGroup(): FormGroup {
    return this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required]
    });
  }

  // Add a new flight leg (limit of 5)
  addLeg(): void {
    if (this.legs.length < 5) {
      this.legs.push(this.createLegFormGroup());
      this.activeFlightIndex = this.legs.length - 1;
    }
  }

  // Remove a flight leg; ensures at least one leg remains
  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);
      if (index === this.activeFlightIndex) {
        this.activeFlightIndex = Math.max(0, this.legs.length - 1);
      }
    }
  }

  // Set the active flight leg index (used by flight tabs in Multi-City)
  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  // --- Passenger management methods ---
  increment(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    this.passengerCounts[type]++;
  }

  decrement(type: 'adult' | 'child' | 'infant', event: Event): void {
    event.stopPropagation();
    if (this.passengerCounts[type] > 0) {
      this.passengerCounts[type]--;
    }
  }

  getPassengerSummary(): string {
    return `${this.passengerCounts.adult} Adult, ${this.passengerCounts.child} Child, ${this.passengerCounts.infant} Infant`;
  }

  // --- Tab handling ---
  // This method will be called when the child flight-type-tabs component emits a new tab value.
  handleTabChange(tab: string): void {
    this.activeTab = tab;
    this.oneWayForm = (tab === 'oneWay');
    this.roundTripForm = (tab === 'roundTrip');
    this.multiCityForm = (tab === 'multiCity');
    this.groupFareForm = (tab === 'groupFare');
  }

  // --- Alert modal ---
  showAlert(message: string): void {
    this.modalMessage = message;
    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // --- Form submission methods ---
  submitOneWayFormData(): void {
    if (this.oneWayFormData.invalid) {
      Object.keys(this.oneWayFormData.controls).forEach(field =>
        this.oneWayFormData.controls[field].markAsTouched()
      );
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.oneWayFormData.value;
    console.log('One way formData submitted', formData);
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        formType: 'one-way',
      },
    });
  }

  submitRoundTripFormData(): void {
    if (this.roundTripFormData.invalid) {
      Object.keys(this.roundTripFormData.controls).forEach(field =>
        this.roundTripFormData.controls[field].markAsTouched()
      );
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.roundTripFormData.value;
    console.log('Round trip formData submitted', formData);
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        formType: 'round-trip',
      },
    });
  }

  submitMultiCityFormData(): void {
    if (this.multiCityFormData.invalid) {
      this.multiCityFormData.markAllAsTouched();
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.multiCityFormData.value;
    console.log('Multi city formData submitted', formData);
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        legs: JSON.stringify(formData.legs),
        formType: 'multi-city',
      },
    });
  }

  // --- Initialization in ngOnInit ---
  ngOnInit(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.loadAirports(query ?? '');
      });

    this.loadAirports('');

    // Initialize One Way form
    this.oneWayFormData = this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required],
      toDate: [null],
      adults: [this.passengerCounts.adult, Validators.required],
      children: [this.passengerCounts.child, Validators.required],
      infants: [this.passengerCounts.infant, Validators.required],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
    });

    // Initialize Round Trip form
    this.roundTripFormData = this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      adults: [this.passengerCounts.adult, Validators.required],
      children: [this.passengerCounts.child, Validators.required],
      infants: [this.passengerCounts.infant, Validators.required],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required],
    });

    // Initialize Multi-City form with one default leg
    this.multiCityFormData = this.formBuilder.group({
      legs: this.formBuilder.array([this.createLegFormGroup()]),
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      infants: [0, [Validators.required, Validators.min(0)]],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required]
    });

    // Synchronize One Way and Round Trip forms to share airport and date data
    this.oneWayFormData.valueChanges.subscribe(value => {
      if (!this.isUpdating) {
        this.isUpdating = true;
        this.roundTripFormData.patchValue({
          origin: value.origin,
          destination: value.destination,
          fromDate: value.fromDate,
          toDate: value.toDate,
        });
        this.isUpdating = false;
      }
    });

    this.roundTripFormData.valueChanges.subscribe(value => {
      if (!this.isUpdating) {
        this.isUpdating = true;
        this.oneWayFormData.patchValue({
          origin: value.origin,
          destination: value.destination,
          fromDate: value.fromDate,
          toDate: value.toDate,
        });
        this.isUpdating = false;
      }
    });
  }
}
