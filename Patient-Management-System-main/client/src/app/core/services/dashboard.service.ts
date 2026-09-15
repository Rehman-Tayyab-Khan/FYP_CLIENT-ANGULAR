import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalPatients: number;
  patientChangePercent: number;
  activeCasesCount: number;
  newCasesToday: number;
  todayAppointmentsCount: number;
  completedVisitsCount: number;
  completionRate: number;
  appointmentsTrend: { date: string; count: number }[];
  caseCategories: { category: string; count: number }[];
  recentPatients: {
    id: string;
    full_name: string;
    registration_date: string;
    status: string;
  }[];
  staffPerformance: {
    name: string;
    department: string;
    patients_handled: number;
  }[];
}

export interface DoctorDashboardStats {
  todayAppointmentsCount: number;
  completedVisitsCount: number;
  activeCasesCount: number;
  myPatientsCount: number;
  appointmentsTrend: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  upcomingAppointments: {
    id: string;
    appointment_number: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    patient_name: string;
    case_number?: string | null;
  }[];
  recentVisits: {
    id: string;
    visit_number: string;
    visit_date: string;
    visit_status: string;
    patient_name: string;
    diagnoses_name?: string | null;
  }[];
}

export interface FdoDashboardStats {
  fdoName: string;
  todayAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  checkedInAppointmentsCount: number;
  completedVisitsTodayCount: number;
  activeCasesCount: number;
  newPatientsThisWeek: number;
  appointmentsTrend: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  upcomingAppointments: {
    id: string;
    appointment_number: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    patient_name: string;
    doctor_name?: string | null;
    case_number?: string | null;
  }[];
  recentVisits: {
    id: string;
    visit_number: string;
    visit_date: string;
    visit_status: string;
    patient_name: string;
    doctor_name?: string | null;
    diagnoses_name?: string | null;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.laravelApiUrl}/dashboard/stats`;
  private doctorApiUrl = `${environment.laravelApiUrl}/dashboard/doctor-stats`;
  private fdoApiUrl = `${environment.laravelApiUrl}/dashboard/fdo-stats`;
  private statsCache$?: Observable<DashboardStats>;
  private doctorStatsCache$?: Observable<DoctorDashboardStats>;
  private fdoStatsCache$?: Observable<FdoDashboardStats>;

  clearStatsCache(): void {
    this.statsCache$ = undefined;
    this.doctorStatsCache$ = undefined;
    this.fdoStatsCache$ = undefined;
  }

  getStats(): Observable<DashboardStats> {
    if (!this.statsCache$) {
      this.statsCache$ = this.http
        .get<{ data: DashboardStats }>(this.apiUrl)
        .pipe(
          map((response) => response.data),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }

    return this.statsCache$;
  }

  getDoctorStats(): Observable<DoctorDashboardStats> {
    if (!this.doctorStatsCache$) {
      this.doctorStatsCache$ = this.http
        .get<{ data: DoctorDashboardStats }>(this.doctorApiUrl)
        .pipe(
          map((response) => response.data),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }

    return this.doctorStatsCache$;
  }

  getFdoStats(): Observable<FdoDashboardStats> {
    if (!this.fdoStatsCache$) {
      this.fdoStatsCache$ = this.http
        .get<{ data: FdoDashboardStats }>(this.fdoApiUrl)
        .pipe(
          map((response) => response.data),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }

    return this.fdoStatsCache$;
  }
}
