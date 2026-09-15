import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createHttpParams } from '../utils/http.utils';
import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentFilters,
  CompleteAppointmentPayload,
  CreateAppointmentPayload,
  CreateAppointmentResponse,
  PaginatedResponse,
  UpdateAppointmentPayload,
} from '../models/appointment.model';
import { ApiResponse } from '../interceptors/api-response.interceptor';
import { Observable, shareReplay, tap } from 'rxjs';
import { Visit } from '../models/visit.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.laravelApiUrl}/appointments`;
  private appointmentsCache = new Map<
    string,
    Observable<PaginatedResponse<Appointment>>
  >();

  private clearAppointmentsCache(): void {
    this.appointmentsCache.clear();
  }

  //INFO: Fetch paginated and filtered appointments
  getAppointments(
    filters: AppointmentFilters = {},
  ): Observable<PaginatedResponse<Appointment>> {
    // Map filters to HttpParams using utility
    const params = createHttpParams(filters);

    const cacheKey = params.toString();
    const cached = this.appointmentsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PaginatedResponse<Appointment>>(this.apiUrl, {
        params,
      })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    this.appointmentsCache.set(cacheKey, request$);

    return request$;
  }

  //INFO: Fetch a single appointment by ID
  getAppointmentById(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
  }

  //INFO: Create a new appointment
  createAppointment(
    payload: CreateAppointmentPayload,
  ): Observable<ApiResponse<CreateAppointmentResponse>> {
    return this.http
      .post<ApiResponse<CreateAppointmentResponse>>(this.apiUrl, payload)
      .pipe(tap(() => this.clearAppointmentsCache()));
  }

  //INFO: Update an existing appointment
  updateAppointment(
    id: string,
    payload: UpdateAppointmentPayload,
  ): Observable<ApiResponse<{ appointment: Appointment }>> {
    return this.http
      .patch<
        ApiResponse<{ appointment: Appointment }>
      >(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.clearAppointmentsCache()));
  }

  completeAppointmentByDoctor(
    id: string,
    payload: CompleteAppointmentPayload,
  ): Observable<ApiResponse<{ appointment: Appointment; visit: Visit }>> {
    return this.http
      .patch<
        ApiResponse<{ appointment: Appointment; visit: Visit }>
      >(`${this.apiUrl}/${id}/complete`, payload)
      .pipe(tap(() => this.clearAppointmentsCache()));
  }

  //INFO: Cancel an appointment
  cancelAppointment(id: string): Observable<ApiResponse<null>> {
    return this.http
      .patch<ApiResponse<null>>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(tap(() => this.clearAppointmentsCache()));
  }

  //INFO: Delete an appointment (soft delete handled by backend)
  deleteAppointment(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearAppointmentsCache()));
  }
}
