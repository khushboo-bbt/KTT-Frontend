import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-multi-city-fields',
  templateUrl: './app-multi-city-fields.component.html',
  styleUrls: ['./app-multi-city-fields.component.css'],
  imports: [NgSelectModule, NgxSliderModule, NgIf,NgFor, ReactiveFormsModule]
})
export class AppMultiCityFieldsComponent {
  @Input() formGroup!: FormGroup;
  @Input() listOfAirports: any[] = [];
  @Input() searchInput$!: Subject<string>;
  @Input() multiCityForm: boolean = true;
  @Input() activeFlightIndex: number = 0;
  @Input() adultOptions: Options = { floor: 1, ceil: 9, step: 1 };
  @Input() childOptions: Options = { floor: 0, ceil: 9, step: 1 };
  @Input() infantOptions: Options = { floor: 0, ceil: 9, step: 1 };
  

  @Output() airportSelect = new EventEmitter<{event: any, field: string}>();
  @Output() swapAirports = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
  @Output() addLegClick = new EventEmitter<void>();
  @Output() removeLegClick = new EventEmitter<number>();
  @Output() activeFlightIndexChange = new EventEmitter<number>();

  today = new Date().toISOString().split('T')[0];
  minToDate = this.today;

  get legs(): FormArray {
    return this.formGroup.get('legs') as FormArray;
  }

  onSearch(term: string): void {
    this.searchInput$.next(term);
  }

  selectAirport2(event: any, field: string): void {
    this.airportSelect.emit({ event, field });
  }

  setActiveFlightIndex(index: number): void {
    if (index >= 0 && index < this.legs.length) {
      this.activeFlightIndex = index;
      this.activeFlightIndexChange.emit(index);
    }
  }

  // When adding a new leg, automatically set it as active
  addLeg(): void {
    if (this.legs.length < 5) {
      // Get the last leg's values
      const lastLeg = this.legs.at(this.legs.length - 1).value;
      
      // Create initial values for the new leg
      const initialValues: any = {
        origin: lastLeg.destination, // Set origin as previous destination
        destination: null,
        fromDate: lastLeg.fromDate // Use same date as previous leg
      };
      
      this.addLegClick.emit(initialValues);
    }
  }

  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);
      
      // Adjust active flight index if needed
      if (this.activeFlightIndex >= this.legs.length) {
        this.activeFlightIndex = this.legs.length - 1;
      } else if (this.activeFlightIndex === index) {
        // Keep the same index unless it was the last flight
        this.activeFlightIndex = Math.min(index, this.legs.length - 1);
      }
      
      // Emit the new active index
      this.activeFlightIndexChange.emit(this.activeFlightIndex);
      this.removeLegClick.emit(index);
    }
  }

  submitMultiCityFormData(): void {
    if (this.formGroup.valid) {
      this.submit.emit();
    }
  }

  updateMinToDate(): void {
    this.minToDate = this.today;
  }

  // Helper method to validate form state
  validateFormState(): void {
    // Ensure we have valid active flight index
    if (this.activeFlightIndex >= this.legs.length) {
      this.activeFlightIndex = this.legs.length - 1;
      this.activeFlightIndexChange.emit(this.activeFlightIndex);
    }
  }

  ngOnInit(): void {
    // Initial validation of form state
    this.validateFormState();
  }
}
