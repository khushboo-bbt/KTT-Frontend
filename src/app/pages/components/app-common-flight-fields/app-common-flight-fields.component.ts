import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-common-flight-fields',
  templateUrl: './app-common-flight-fields.component.html',
  styleUrls: ['./app-common-flight-fields.component.css'],
  imports: [NgSelectModule, NgxSliderModule, NgIf]
})
export class AppCommonFlightFieldsComponent {
  @Input()
  formGroup!: FormGroup;
  @Input() showReturn: boolean = false;
  @Input() listOfAirports: any[] = [];  // Expect an array of airport objects with properties like iataCode, airportCity, airportName, and displayLabel
  @Output() swapAirports = new EventEmitter<void>();

  today: string = new Date().toISOString().split('T')[0];

  onSwap(): void {
    this.swapAirports.emit();
  }
}
