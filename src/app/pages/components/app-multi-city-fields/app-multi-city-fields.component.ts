import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {   FormGroup, FormArray, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';

@Component({
  selector: 'app-multi-city-fields',
  templateUrl: './app-multi-city-fields.component.html',
  styleUrls: ['./app-multi-city-fields.component.css'],
  imports: [NgSelectModule,NgFor, NgIf, ReactiveFormsModule]
})
export class AppMultiCityFieldsComponent {
  @Input()
  formGroup!: FormGroup; // Expected to have a 'legs' FormArray plus additional controls (adults, children, infants, routes, class)
  @Output() swapAirports = new EventEmitter<void>();
  @Input() listOfAirports: any[] = [];

  activeFlightIndex: number = 0;

  constructor(private fb: FormBuilder) {}

  // Get the legs FormArray from the formGroup
  get legs(): FormArray {
    return this.formGroup.get('legs') as FormArray;
  }

  // Set the active flight leg
  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  // Called when the swap icon is clicked in the active leg
  onSwap(): void {
    this.swapAirports.emit();
  }

  // Add a new flight leg (limit to 5)
  addLeg(): void {
    if (this.legs.length < 5) {
      this.legs.push(this.createLegFormGroup());
      this.activeFlightIndex = this.legs.length - 1;
    }
  }

  // Remove a flight leg (at least one leg must remain)
  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);
      if (index === this.activeFlightIndex) {
        this.activeFlightIndex = Math.max(0, this.legs.length - 1);
      }
    }
  }

  // Helper to create a new leg form group (this should match your parent’s structure)
  createLegFormGroup(): FormGroup {
    return this.fb.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required]
    });
  }

  // For date inputs in multi-city, you may use the current date.
  today: string = new Date().toISOString().split('T')[0];
}
