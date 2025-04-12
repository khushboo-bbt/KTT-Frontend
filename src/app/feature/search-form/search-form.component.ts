import { Component, computed, OnInit } from '@angular/core';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Options } from '@angular-slider/ngx-slider';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule , NgIf, NgFor, AsyncPipe } from '@angular/common';
import { SearchFormService } from '../../services/search-form/search-form.service';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { query } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';
import { AppCarouselComponent } from '../../pages/components/app-carousel/app-carousel.component';
import { AppFlightTypeTabsComponent } from '../../pages/components/app-flight-type-tabs/app-flight-type-tabs.component';
import { AppCommonFlightFieldsComponent } from '../../pages/components/app-common-flight-fields/app-common-flight-fields.component';
import { AppMultiCityFieldsComponent } from '../../pages/components/app-multi-city-fields/app-multi-city-fields.component';
import { ActivatedRoute } from '@angular/router';

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
    AppMultiCityFieldsComponent,
  ],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css',
})
export class SearchFormComponent implements OnInit {

  today: string = new Date().toISOString().split('T')[0];
  minToDate: string = this.today;
  searchInput$ = new Subject<string>();


  updateMinToDate(): void {
    const fromDate = this.roundTripFormData.get('fromDate')?.value;
    this.minToDate = fromDate ? fromDate : this.today;
  }

  constructor(
    private formBuilder: FormBuilder,
    private searchFormService: SearchFormService,
    private router: Router,
    private route: ActivatedRoute 
  ) {}
  
  activeFlightIndex: number = 0;

  selectAirport(event: any, field: string) {
    if (!event || !event.iataCode) return;
  
    const selectedCode = event.iataCode;
  
    // Update One Way and Round Trip
    if (field === 'origin') {
      this.oneWayFormData.patchValue({ origin: selectedCode });
      this.roundTripFormData.patchValue({ origin: selectedCode });
    } else if (field === 'destination') {
      this.oneWayFormData.patchValue({ destination: selectedCode });
      this.roundTripFormData.patchValue({ destination: selectedCode });
    }
  
  
    // Validate One Way
    const oneWayOrigin = this.oneWayFormData.value.origin;
    const oneWayDestination = this.oneWayFormData.value.destination;
    if (oneWayOrigin && oneWayDestination && oneWayOrigin === oneWayDestination) {
      alert(`The "From" and "To" fields for One Way cannot be the same.`);
      this.oneWayFormData.patchValue({ [field]: '' });
    }
  
    // Validate Round Trip
    const roundTripOrigin = this.roundTripFormData.value.origin;
    const roundTripDestination = this.roundTripFormData.value.destination;
    if (roundTripOrigin && roundTripDestination && roundTripOrigin === roundTripDestination) {
      alert(`The "From" and "To" fields for Round Trip cannot be the same.`);
      this.roundTripFormData.patchValue({ [field]: '' });
    }
  }

  selectAirport2(event: any, field: string) {
    if (!event || !event.iataCode) return;
    const selectedCode = event.iataCode;

    // Handle active Multi-City leg
    const legsArray = this.multiCityFormData.get('legs') as FormArray;
    const currentLeg = legsArray.at(this.activeFlightIndex) as FormGroup;
  
    // First, patch the current field value
    currentLeg.patchValue({ [field]: selectedCode });

    // Then, validate the current leg's from and to
    const currentLegValues = currentLeg.value;
    if (
      currentLegValues.origin &&
      currentLegValues.destination &&
      currentLegValues.origin === currentLegValues.destination
    ) {
      alert(`The "From" and "To" fields in leg ${this.activeFlightIndex + 1} cannot be the same.`);
      // Reset only the field user just selected
      currentLeg.patchValue({ [field]: '' });
      return;
    }
  }
  
  
  listOfAirports: any[] = [];

  // Multicity add flight tabs
  // Signal for easy access to legs array
  get legs(): FormArray {
    return this.multiCityFormData.get('legs') as FormArray;
  }
  
  // Create a leg form group
  createLegFormGroup(): FormGroup {
    return this.formBuilder.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required]
    });
  }
   // Add a new leg (max 5)
   addLeg(): void {
    if (this.legs.length < 5) {
      this.legs.push(this.createLegFormGroup());
      this.activeFlightIndex = this.legs.length - 1; // Set newly added flight as active
    }
  }

  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);
  
      // Ensure the last available tab remains active
      if (index === this.activeFlightIndex) {
        this.activeFlightIndex = Math.max(0, this.legs.length - 1);
      }
    }
  }  
  
  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  passengerCounts = {
    adult: 1,
    child: 0,
    infant: 0,
  };

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
    
  getPassengerSummary() {
    return ` ${this.passengerCounts.adult} Adult, ${this.passengerCounts.child} Child, ${this.passengerCounts.infant} Infant`;
  }

  toggleDropdown(event: MouseEvent): void {
    // Check if the click is on the dropdown toggle button (this prevents closing when clicking the button)
    const dropdownMenu = document.querySelector('.dropdown-menu') as HTMLElement;
    const dropdownButton = document.getElementById('passengerDropdown') as HTMLElement;

    // Toggle dropdown manually if click is not on an increment/decrement button
    if (!dropdownMenu.contains(event.target as Node) && event.target !== dropdownButton) {
      return;  // Don't close the dropdown when clicking on the buttons
    }
    
  }
  
  // Origin and destination
  selectedOrigin: string | undefined;
  selectedDestination: string | undefined;

  // Method to swap the values of origin and destination
  swapSelection() {
    // Swap logic for One Way Form
    if (this.oneWayFormData) {
      const origin = this.oneWayFormData.get('origin').value;
      const destination = this.oneWayFormData.get('destination').value;
      this.oneWayFormData.patchValue({
        origin: destination,
        destination: origin
      });
    }
  }  
  isUpdating = false;

  modalMessage: string = '';
  showAlert(message: string) {
    this.modalMessage = message;

    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  oneWayFormData: any = FormGroup;

  submitOneWayFormData() {
    if (this.oneWayFormData.invalid) {
      Object.keys(this.oneWayFormData.controls).forEach((field) => {
        this.oneWayFormData.controls[field].markAsTouched();
      });
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

  roundTripFormData: any = FormGroup;

  submitRoundTripFormData() {
    if (this.roundTripFormData.invalid) {
      Object.keys(this.roundTripFormData.controls).forEach((field) => {
        this.roundTripFormData.controls[field].markAsTouched();
      });
  
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.roundTripFormData.value;
    console.log('round trip formData submitted', formData);
    // this.flightBookingService.updateFlightData(formData);
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        formType: 'round-trip', // This marks the form as a one-way submission
        
      },
    });
  }  
  
  multiCityFormData: any = FormGroup;
  submitMultiCityFormData(): void {
    if (this.multiCityFormData.invalid) {
      this.multiCityFormData.markAllAsTouched(); // This is key
      this.showAlert('Please fill out all required fields.');
      return;
    }
    const formData = this.multiCityFormData.value;
    console.log('multi city formData submitted', formData);
    this.router.navigate(['/flight-search'], {
      queryParams: {
        ...formData,
        legs: JSON.stringify(formData.legs),
        formType: 'multi-city',
      },
    });
  }  
  
  loadAirports(query: string): void {
    this.searchFormService.getAirports(query).subscribe(
      (data) => {
        // Map the response to include a `displayLabel` field
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
    this.route.queryParams.subscribe((params) => {
      const currentRoute = this.router.url.split('?')[0]; // get the route path
    
      if (currentRoute === '/flight-search' && Object.keys(params).length > 0) {
        const formType = params['formType'];
    
        if (formType === 'one-way') {
          this.oneWayFormData.patchValue({
            origin: params['origin'] || null,
            destination: params['destination'] || null,
            fromDate: params['fromDate'] || '',
            toDate: params['toDate'] || null,
            adults: +params['adults'] || 1,
            children: +params['children'] || 0,
            infants: +params['infants'] || 0,
            routes: params['routes'] || 'Non Stop',
            class: params['class'] || 'Economy',
          });
          this.toggleOneWayTrip();
        }
    
        if (formType === 'round-trip') {
          this.roundTripFormData.patchValue({
            origin: params['origin'] || null,
            destination: params['destination'] || null,
            fromDate: params['fromDate'] || '',
            toDate: params['toDate'] || '',
            adults: +params['adults'] || 1,
            children: +params['children'] || 0,
            infants: +params['infants'] || 0,
            routes: params['routes'] || 'Non Stop',
            class: params['class'] || 'Economy',
          });
          this.toggleRoundTrip();
        }
    
        if (formType === 'multi-city') {
          const legs = JSON.parse(params['legs'] || '[]');
          if (legs.length) {
            const legControls = legs.map((leg: any) =>
              this.formBuilder.group({
                origin: [leg.origin, Validators.required],
                destination: [leg.destination, Validators.required],
                fromDate: [leg.fromDate, Validators.required]
              })
            );
            this.multiCityFormData.setControl('legs', new FormArray(legControls));
          }
          this.multiCityFormData.patchValue({
            adults: +params['adults'] || 1,
            children: +params['children'] || 0,
            infants: +params['infants'] || 0,
            routes: params['routes'] || 'Non Stop',
            class: params['class'] || 'Economy',
          });
          this.toggleMultiCity();
        }
      }
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
    this.multiCityFormData = this.formBuilder.group({
      legs: this.formBuilder.array([this.createLegFormGroup()]), // Default one leg
      adults: [1, [Validators.required, Validators.min(1)]],
      infants: [0, [Validators.required, Validators.min(0)]],
      children: [0, [Validators.required, Validators.min(0)]],
      routes: ['Non Stop', Validators.required],
      class: ['Economy', Validators.required]
    });

    // Sync One Way and Round Trip forms
    this.oneWayFormData.valueChanges.subscribe((value: { origin: any; destination: any; fromDate: any; toDate:any; }) => {
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

    this.roundTripFormData.valueChanges.subscribe((value: { origin: any; destination: any; fromDate: any;  toDate:any; }) => {
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

  passengerOptions = {
    adult: {
      value: 1,
      options: {
        floor: 1,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    },
    child: {
      value: 0,
      options: {
        floor: 0,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    },
    infant: {
      value: 0,
      options: {
        floor: 0,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: () => 'var(--primary)',
        getSelectionBarColor: () => 'var(--primary)',
      } as Options
    }
  };

  oneWayForm: boolean = true;
  roundTripForm: boolean = false;
  multiCityForm: boolean = false;
  groupFareForm: boolean = false;

  activeTab: string = 'oneWay'; // Set the default active tab to 'oneWay'
  toggleOneWayTrip() {
    if (this.roundTripForm || this.multiCityForm || this.groupFareForm) {
      this.oneWayForm = true;
      this.roundTripForm = false;
      this.multiCityForm = false;
      this.groupFareForm = false;
      this.activeTab = 'oneWay';
    }
  }

  toggleRoundTrip() {
    if (this.oneWayForm || this.multiCityForm || this.groupFareForm) {
      this.roundTripForm = true;
      this.oneWayForm = false;
      this.multiCityForm = false;
      this.groupFareForm = false;
      this.activeTab = 'roundTrip';
    }
  }

  toggleMultiCity() {
    if (this.oneWayForm || this.roundTripForm || this.groupFareForm) {
      this.multiCityForm = true;
      this.oneWayForm = false;
      this.roundTripForm = false;
      this.groupFareForm = false;
      this.activeTab = 'multiCity';
    }
  }

  // toggleGroupFare() {
  //   if (this.oneWayForm || this.roundTripForm || this.multiCityForm) {
  //     this.groupFareForm = true;
  //     this.oneWayForm = false;
  //     this.roundTripForm = false;
  //     this.multiCityForm = false;
  //     this.activeTab = 'groupFare';
  //   }
  // }

  handleSliderChange(value: any) {
    console.log('Value ->', value);
  }
  onSearch(term: string): void {
    this.searchInput$.next(term)
  }
  // getUsers() {
  //   this.flightBookingService.getAllUsers().subscribe({
  //     next: (response: any) => {
  //       console.log('Users--', response);
  //     },
  //     error: (error: any) => {
  //       console.log('Error fetching users--', error);
  //     },
  //   });
  // }
}
