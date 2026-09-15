import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  CreatePracticeLocationPayload,
  PracticeLocation,
  PracticeLocationFilters,
  UpdatePracticeLocationPayload,
} from '../models/practice-location.model';
import { PaginatedResponse } from '../models/patient.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';

@Injectable({
  providedIn: 'root',
})
export class PracticeLocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.laravelApiUrl}/practice-locations`;
  private readonly practiceLocationsCache = new Map<
    string,
    Observable<PaginatedResponse<PracticeLocation>>
  >();

  private clearPracticeLocationsCache(): void {
    this.practiceLocationsCache.clear();
  }

  getPracticeLocations(
    filters: PracticeLocationFilters = {},
  ): Observable<PaginatedResponse<PracticeLocation>> {
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.practiceLocationsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<PracticeLocation>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.practiceLocationsCache.set(cacheKey, request$);

    return request$;
  }

  getPracticeLocationById(
    id: string,
  ): Observable<ApiResponse<PracticeLocation>> {
    return this.http.get<ApiResponse<PracticeLocation>>(`${this.apiUrl}/${id}`);
  }

  createPracticeLocation(
    payload: CreatePracticeLocationPayload,
  ): Observable<ApiResponse<{ practice_location: PracticeLocation }>> {
    return this.http
      .post<
        ApiResponse<{ practice_location: PracticeLocation }>
      >(this.apiUrl, payload)
      .pipe(tap(() => this.clearPracticeLocationsCache()));
  }

  updatePracticeLocation(
    id: string,
    payload: UpdatePracticeLocationPayload,
  ): Observable<ApiResponse<{ practice_location: PracticeLocation }>> {
    return this.http
      .patch<
        ApiResponse<{ practice_location: PracticeLocation }>
      >(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearPracticeLocationsCache()));
  }

  deletePracticeLocation(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearPracticeLocationsCache()));
  }
}
