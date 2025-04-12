import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Airport } from '../../../models/Airport';
import { Subject } from 'rxjs';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-multi-city-fields',
  templateUrl: './app-multi-city-fields.component.html',
  styleUrls: ['./app-multi-city-fields.component.css'],
  imports: [NgSelectModule, NgFor, NgIf, ReactiveFormsModule, NgxSliderModule]
})
export class AppMultiCityFieldsComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() listOfAirports: any[] = [];
  @Input() searchInput$ = new Subject<string>();
  @Input() adultOptions: any;
  @Input() childOptions: any;
  @Input() infantOptions: any;
  
  @Output() airportSelect = new EventEmitter<{event: any, field: string}>();
  @Output() swapAirports = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  activeFlightIndex: number = 0;
  today = new Date().toISOString().split('T')[0];
  minToDate = this.today;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  get legs(): FormArray {
    return this.formGroup.get('legs') as FormArray;
  }

  addLeg(): void {
    if (this.legs.length < 5) {
      this.legs.push(this.createLegFormGroup());
      this.activeFlightIndex = this.legs.length - 1;
    }
  }

  removeLeg(index: number): void {
    if (this.legs.length > 1) {
      this.legs.removeAt(index);
      if (index === this.activeFlightIndex) {
        this.activeFlightIndex = Math.max(0, this.legs.length - 1);
      }
    }
  }

  createLegFormGroup(): FormGroup {
    return this.fb.group({
      origin: [null, Validators.required],
      destination: [null, Validators.required],
      fromDate: ['', Validators.required]
    });
  }

  selectAirport2(event: any, field: string): void {
    this.airportSelect.emit({ event, field });
  }

  onSwap(): void {
    this.swapAirports.emit();
  }

  setActiveFlight(index: number): void {
    this.activeFlightIndex = index;
  }

  onSearch(term: string): void {
    this.searchInput$.next(term);
  }

  updateMinToDate(): void {
    const fromDate = this.formGroup.get('fromDate')?.value;
    this.minToDate = fromDate || this.today;
  }

  submitMultiCityFormData(): void {
    if (this.formGroup.valid) {
      this.submit.emit();
    }
  }

  private initializeForm(): void {
    if (!this.formGroup) {
      this.formGroup = this.fb.group({
        legs: this.fb.array([this.createLegFormGroup()]),
        adults: [1, [Validators.required, Validators.min(1)]],
        children: [0, [Validators.required, Validators.min(0)]],
        infants: [0, [Validators.required, Validators.min(0)]],
        routes: ['Non Stop', Validators.required],
        class: ['Economy', Validators.required]
      });
    }
  }
}
