import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  CreateFirmPayload,
  Firm,
  FirmFilters,
  UpdateFirmPayload,
} from '../models/firm.model';
import { PaginatedResponse } from '../models/patient.model';
import { createHttpParams } from '../utils/http.utils';
import { ApiResponse } from '../interceptors/api-response.interceptor';

@Injectable({
  providedIn: 'root',
})
export class FirmService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.laravelApiUrl}/firms`;
  private firmsCache = new Map<string, Observable<PaginatedResponse<Firm>>>();

  private clearFirmsCache(): void {
    this.firmsCache.clear();
  }

  getFirms(filters: FirmFilters = {}): Observable<PaginatedResponse<Firm>> {
    const params = createHttpParams(filters);
    const cacheKey = params.toString();
    const cached = this.firmsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Firm>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.firmsCache.set(cacheKey, request$);

    return request$;
  }

  getFirmById(id: string): Observable<ApiResponse<{ firm: Firm }>> {
    return this.http.get<ApiResponse<{ firm: Firm }>>(`${this.apiUrl}/${id}`);
  }

  createFirm(
    payload: CreateFirmPayload,
  ): Observable<ApiResponse<{ firm: Firm }>> {
    return this.http
      .post<ApiResponse<{ firm: Firm }>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearFirmsCache()));
  }

  updateFirm(
    id: string,
    payload: UpdateFirmPayload,
  ): Observable<ApiResponse<{ firm: Firm }>> {
    return this.http
      .patch<ApiResponse<{ firm: Firm }>>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearFirmsCache()));
  }

  deleteFirm(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearFirmsCache()));
  }
}
