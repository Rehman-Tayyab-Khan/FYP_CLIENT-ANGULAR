import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interceptors/api-response.interceptor';
import {
  CreateFdoPayload,
  FdoFilters,
  FdoPermissionOption,
  FdoUser,
  PaginatedResponse,
  UpdateFdoPayload,
} from '../models/fdo.model';

@Injectable({
  providedIn: 'root',
})
export class FdoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.expressApiUrl}/users`;
  private readonly fdosCache = new Map<
    string,
    Observable<PaginatedResponse<FdoUser>>
  >();
  private permissionsCache$?: Observable<
    ApiResponse<{ permissions: FdoPermissionOption[] }>
  >;

  private clearFdoCache(): void {
    this.fdosCache.clear();
  }

  getFdos(filters: FdoFilters = {}): Observable<PaginatedResponse<FdoUser>> {
    const params = createHttpParams({ ...filters, role: 'fdo' });

    const cacheKey = params.toString();
    const cached = this.fdosCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<FdoUser>>(this.apiUrl, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.fdosCache.set(cacheKey, request$);

    return request$;
  }

  getFdoById(id: string): Observable<ApiResponse<{ user: FdoUser }>> {
    return this.http.get<ApiResponse<{ user: FdoUser }>>(
      `${this.apiUrl}/${id}`,
    );
  }

  getPermissions(): Observable<
    ApiResponse<{ permissions: FdoPermissionOption[] }>
  > {
    if (!this.permissionsCache$) {
      this.permissionsCache$ = this.http
        .get<
          ApiResponse<{ permissions: FdoPermissionOption[] }>
        >(`${this.apiUrl}/permissions`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }

    return this.permissionsCache$;
  }

  createFdo(
    payload: CreateFdoPayload,
  ): Observable<ApiResponse<{ user: FdoUser }>> {
    return this.http
      .post<ApiResponse<{ user: FdoUser }>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearFdoCache()));
  }

  updateFdo(
    id: string,
    payload: UpdateFdoPayload,
  ): Observable<ApiResponse<{ user: FdoUser }>> {
    return this.http
      .put<ApiResponse<{ user: FdoUser }>>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearFdoCache()));
  }

  deleteFdo(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearFdoCache()));
  }
}
