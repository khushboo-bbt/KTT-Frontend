import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-flight-type-tabs',
  templateUrl: './app-flight-type-tabs.component.html',
  styleUrls: ['./app-flight-type-tabs.component.css']
})
export class AppFlightTypeTabsComponent {
  @Input() activeTab: string = 'oneWay';

  @Output() tabChange: EventEmitter<string> = new EventEmitter<string>();
  @Input() toggleRoundTrip: any;
  @Input() toggleMultiCity: any;
  @Input() toggleGroupFare: any;
  @Input() toggleOneWayTrip: any;

  onTabChange(tab: string): void {
    this.tabChange.emit(tab);
  }
  oneWayForm: any;
  roundTripForm: any;
  multiCityForm: any;
}
