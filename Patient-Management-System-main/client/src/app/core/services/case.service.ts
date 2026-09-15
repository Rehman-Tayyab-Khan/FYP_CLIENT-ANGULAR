import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  Case,
  CaseFilters,
  CreateCasePayload,
  CreateCaseResponse,
  UpdateCasePayload,
} from '../models/case.model';
import { PaginatedResponse } from '../models/patient.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';

@Injectable({
  providedIn: 'root',
})
export class CaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.expressApiUrl}/cases`;
  private casesCache = new Map<string, Observable<PaginatedResponse<Case>>>();

  private clearCasesCache(): void {
    this.casesCache.clear();
  }

  getCases(filters: CaseFilters = {}): Observable<PaginatedResponse<Case>> {
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.casesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Case>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.casesCache.set(cacheKey, request$);

    return request$;
  }

  getCaseById(id: string): Observable<ApiResponse<{ case: Case }>> {
    return this.http.get<ApiResponse<{ case: Case }>>(`${this.apiUrl}/${id}`);
  }

  createCase(
    payload: CreateCasePayload,
  ): Observable<ApiResponse<CreateCaseResponse>> {
    return this.http
      .post<ApiResponse<CreateCaseResponse>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearCasesCache()));
  }

  updateCase(
    id: string,
    payload: UpdateCasePayload,
  ): Observable<ApiResponse<{ case: Case }>> {
    return this.http
      .patch<ApiResponse<{ case: Case }>>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearCasesCache()));
  }

  deleteCase(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearCasesCache()));
  }
}
