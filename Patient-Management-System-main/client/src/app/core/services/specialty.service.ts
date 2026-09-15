import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';
import { PaginatedResponse } from '../models/patient.model';
import {
  CreateSpecialtyPayload,
  Specialty,
  SpecialtyFilters,
  UpdateSpecialtyPayload,
} from '../models/specialty.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';

@Injectable({
  providedIn: 'root',
})
export class SpecialtyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.expressApiUrl}/specialties`;
  private readonly specialtiesCache = new Map<
    string,
    Observable<PaginatedResponse<Specialty>>
  >();

  private clearSpecialtiesCache(): void {
    this.specialtiesCache.clear();
  }

  getSpecialties(
    filters: SpecialtyFilters = {},
  ): Observable<PaginatedResponse<Specialty>> {
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.specialtiesCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Specialty>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.specialtiesCache.set(cacheKey, request$);

    return request$;
  }

  createSpecialty(
    payload: CreateSpecialtyPayload,
  ): Observable<ApiResponse<{ specialty: Specialty }>> {
    return this.http
      .post<ApiResponse<{ specialty: Specialty }>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearSpecialtiesCache()));
  }

  getSpecialtyById(
    id: string,
  ): Observable<ApiResponse<{ specialty: Specialty }>> {
    return this.http.get<ApiResponse<{ specialty: Specialty }>>(
      `${this.apiUrl}/${id}`,
    );
  }

  updateSpecialty(
    id: string,
    payload: UpdateSpecialtyPayload,
  ): Observable<ApiResponse<{ specialty: Specialty }>> {
    return this.http
      .put<
        ApiResponse<{ specialty: Specialty }>
      >(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearSpecialtiesCache()));
  }

  deleteSpecialty(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearSpecialtiesCache()));
  }
}
