import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  LogoutResponse,
} from '../models/auth.model';
import { FDO_PERMISSIONS, FdoPermission } from '../constants/fdo-permissions';

import { ApiResponse } from '../interceptors/api-response.interceptor';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  router = inject(Router);

  private apiUrl = environment.expressApiUrl;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  init(): Observable<void> {
    return this.checkAuthOnInit();
  }

  // Check Auth on App Init
  checkAuthOnInit(): Observable<void> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        const apiResponse = response as ApiResponse<any>;
        const user = apiResponse?.data.user;
        console.log(user);

        this.currentUserSubject.next(user ?? null);
      }),
      map(() => void 0),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(void 0);
      }),
    );
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<
        ApiResponse<LoginResponse>
      >(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.currentUserSubject.next(response.data?.user!);
        }),
      );
  }

  logout(): Observable<LogoutResponse> {
    return this.http
      .post<LogoutResponse>(
        `${this.apiUrl}/auth/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }

  //  Helper functions

  getCurrentUser(): AuthUser {
    return this.currentUserSubject.value!;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  isDoctor(): boolean {
    return this.getCurrentUser()?.role === 'doctor';
  }

  isFdo(): boolean {
    return this.getCurrentUser()?.role === 'fdo';
  }

  getPermissions(): string[] {
    return this.getCurrentUser()?.permissions || [];
  }

  private matchesPermission(
    userPermissions: string[],
    permission: FdoPermission,
  ): boolean {
    if (userPermissions.includes(permission)) {
      return true;
    }

    // if (permission === FDO_PERMISSIONS.VIEW_DOCTORS) {
    //   return userPermissions.includes(FDO_PERMISSIONS.VIEW_DOCTORS);
    // }

    return false;
  }

  hasPermission(permission: FdoPermission): boolean {
    //INFO: Doctor permissions are handled in the backend and component pages as well.
    if (this.isAdmin() || this.isDoctor()) {
      return true;
    }

    if (!this.isFdo()) {
      return false;
    }

    const userPermissions = this.getPermissions();

    //INFO: Update appointment is a superset of view appointment.
    if (
      permission === FDO_PERMISSIONS.VIEW_APPOINTMENTS &&
      userPermissions.includes(FDO_PERMISSIONS.UPDATE_APPOINTMENT)
    ) {
      return true;
    }

    return this.matchesPermission(userPermissions, permission);
  }

  hasAnyPermission(permissions: FdoPermission[]): boolean {
    if (this.isAdmin() || this.isDoctor()) {
      return true;
    }

    if (!this.isFdo()) {
      return false;
    }

    const userPermissions = this.getPermissions();
    return permissions.some((permission) =>
      this.matchesPermission(userPermissions, permission),
    );
  }

  getFirstAllowedFdoRoute(): string {
    if (this.hasPermission(FDO_PERMISSIONS.VIEW_PATIENTS)) {
      return '/fdo/patients';
    }

    if (this.hasPermission(FDO_PERMISSIONS.VIEW_CASES)) {
      return '/fdo/cases';
    }

    if (this.hasPermission(FDO_PERMISSIONS.CREATE_PATIENT)) {
      return '/fdo/patients/new';
    }

    if (this.hasPermission(FDO_PERMISSIONS.CREATE_CASE)) {
      return '/fdo/cases/new';
    }

    if (this.hasPermission(FDO_PERMISSIONS.VIEW_APPOINTMENTS)) {
      return '/fdo/appointments';
    }

    if (this.hasPermission(FDO_PERMISSIONS.CREATE_APPOINTMENT)) {
      return '/fdo/appointments/new';
    }

    if (this.hasPermission(FDO_PERMISSIONS.UPDATE_APPOINTMENT)) {
      return '/fdo/appointments';
    }

    return '/fdo/dashboard';
  }

  // Redirect to correct dashboard based on role
  redirectToDashboard(): void {
    console.log(this.currentUserSubject.value?.role);

    const role = this.getCurrentUser()?.role;
    if (role === 'admin') this.router.navigate(['/admin/dashboard']);
    else if (role === 'doctor') this.router.navigate(['/doctor/dashboard']);
    else if (role === 'fdo')
      this.router.navigate([this.getFirstAllowedFdoRoute()]);
  }
}
