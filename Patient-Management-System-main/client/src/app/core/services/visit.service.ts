import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import {
  PaginatedResponse,
  UpdateVisitPayload,
  Visit,
  VisitFilters,
} from '../models/visit.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VisitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.laravelApiUrl}/visits`;
  private readonly visitsCache = new Map<
    string,
    Observable<PaginatedResponse<Visit>>
  >();

  private clearVisitsCache(): void {
    this.visitsCache.clear();
  }

  getVisits(filters: VisitFilters = {}): Observable<PaginatedResponse<Visit>> {
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.visitsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Visit>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.visitsCache.set(cacheKey, request$);

    return request$;
  }

  getVisitById(id: string): Observable<ApiResponse<Visit>> {
    return this.http.get<ApiResponse<Visit>>(`${this.apiUrl}/${id}`);
  }

  updateVisit(
    id: string,
    payload: UpdateVisitPayload,
  ): Observable<ApiResponse<{ visit: Visit }>> {
    return this.http
      .patch<ApiResponse<{ visit: Visit }>>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearVisitsCache()));
  }

  deleteVisit(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearVisitsCache()));
  }
}
