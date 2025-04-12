import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { development_environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchFormService {
  // url = development_environment.apiUrl;
  lccUrl = development_environment.lccUrl;
  constructor(private httpClient: HttpClient, private router: Router) {}


  getAirports(query: string): Observable<any[]> {
    const params = new HttpParams().set('query', query);
    return this.httpClient.get<any[]>(`${this.lccUrl}/booking/search`, { params });
  }
  
  // Ensure we request raw text data (XML) instead of JSON
  getAllLowCostCarrier(formData: any) {
    return this.httpClient.post(
      this.lccUrl + '/low-fare-search',
      formData,
      { responseType: 'text' as 'json' }
    );
  }
  getAirPrice(formData: any) {
    return this.httpClient.post(
      this.lccUrl + '/air-price',
      formData,
      { responseType: 'text' as 'json' }
    );
  }  
}