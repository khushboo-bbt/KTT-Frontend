import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgFor, NgIf } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-common-flight-fields',
  templateUrl: './app-common-flight-fields.component.html',
  styleUrls: ['./app-common-flight-fields.component.css'],
  imports: [NgSelectModule, NgxSliderModule, NgIf, ReactiveFormsModule]
})
export class AppCommonFlightFieldsComponent {
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

}
