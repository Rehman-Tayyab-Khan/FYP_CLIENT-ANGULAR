import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  CreateInsurancePayload,
  Insurance,
  InsuranceFilters,
  UpdateInsurancePayload,
} from '../models/insurance.model';
import { PaginatedResponse } from '../models/patient.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';

@Injectable({
  providedIn: 'root',
})
export class InsuranceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.laravelApiUrl}/insurances`;
  private readonly insurancesCache = new Map<
    string,
    Observable<PaginatedResponse<Insurance>>
  >();

  private clearInsurancesCache(): void {
    this.insurancesCache.clear();
  }

  getInsurances(
    filters: InsuranceFilters = {},
  ): Observable<PaginatedResponse<Insurance>> {
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.insurancesCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Insurance>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.insurancesCache.set(cacheKey, request$);

    return request$;
  }

  getInsuranceById(
    id: string,
  ): Observable<ApiResponse<{ insurance: Insurance }>> {
    return this.http.get<ApiResponse<{ insurance: Insurance }>>(
      `${this.apiUrl}/${id}`,
    );
  }

  createInsurance(
    payload: CreateInsurancePayload,
  ): Observable<ApiResponse<{ insurance: Insurance }>> {
    return this.http
      .post<ApiResponse<{ insurance: Insurance }>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearInsurancesCache()));
  }

  updateInsurance(
    id: string,
    payload: UpdateInsurancePayload,
  ): Observable<ApiResponse<{ insurance: Insurance }>> {
    return this.http
      .patch<
        ApiResponse<{ insurance: Insurance }>
      >(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearInsurancesCache()));
  }

  deleteInsurance(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearInsurancesCache()));
  }
}
