import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgFor, NgIf } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-common-flight-fields',
  templateUrl: './app-common-flight-fields.component.html',
  styleUrls: ['./app-common-flight-fields.component.css'],
  imports: [NgSelectModule, NgxSliderModule, NgIf,NgFor, ReactiveFormsModule]
})
export class AppCommonFlightFieldsComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() showReturn: boolean = false;
  @Input() today: string = '';
  @Input() minToDate: string = '';
  @Input() listOfAirports: any[] = [];
  @Input() searchInput$ = new Subject<string>();
  @Input() adultOptions: Options = { floor: 1, ceil: 9, step: 1 };
  @Input() childOptions: Options = { floor: 0, ceil: 9, step: 1 };
  @Input() infantOptions: Options = { floor: 0, ceil: 9, step: 1 };

  @Output() swapAirports = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
  @Output() airportSelect = new EventEmitter<{event: any, field: string}>();

  specialFares = [
    { id: 'armedForces', label: 'Armed Forces' },
    { id: 'medicalProfessionals', label: 'Medical Professionals' },
    { id: 'seniorCitizens', label: 'Senior Citizens' },
    { id: 'students', label: 'Students' }
  ];

  selectedSpecialFare: string | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Initialize special fare controls if they don't exist
    this.specialFares.forEach(fare => {
      if (!this.formGroup.contains(fare.id)) {
        this.formGroup.addControl(fare.id, this.fb.control('0'));
      }
    });

    // Check which special fare is selected
    for (const fare of this.specialFares) {
      if (this.formGroup.get(fare.id)?.value === '1') {
        this.selectedSpecialFare = fare.id;
        break;
      }
    }
  }

  selectAirport(event: any, field: string) {
    this.airportSelect.emit({ event, field });
  }

  onSearch(term: string): void {
    this.searchInput$.next(term);
  }

  updateMinToDate() {
    const fromDate = this.formGroup.get('fromDate')?.value;
    this.minToDate = fromDate ? fromDate : this.today;
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.submit.emit();
    }
  }

  toggleSpecialFare(fareId: string): void {
    if (this.selectedSpecialFare === fareId) {
      this.selectedSpecialFare = null;
      this.specialFares.forEach(fare => {
        this.formGroup.get(fare.id)?.setValue('0');
      });
    } else {
      this.selectedSpecialFare = fareId;
      this.specialFares.forEach(fare => {
        this.formGroup.get(fare.id)?.setValue(fare.id === fareId ? '1' : '0');
      });
    }
  }

  isSpecialFareSelected(fareId: string): boolean {
    return this.formGroup.get(fareId)?.value === '1';
  }
}
