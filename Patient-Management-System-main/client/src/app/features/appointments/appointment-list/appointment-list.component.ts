import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AppointmentService } from '../../../core/services/appointment.service';
import {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  AppointmentType,
} from '../../../core/models/appointment.model';
import { AppointmentFormComponent } from '../appointment-form/appointment-form.component';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FDO_PERMISSIONS } from '../../../core/constants/fdo-permissions';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EntityTableComponent,
    ConfirmDialogComponent,
    AppointmentFormComponent,
    RouterLink,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css'],
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly dropdownPageSize = environment.searchableSelectPageSize;
  private readonly filterDebounceMs = environment.filterDebounceMs;

  //INFO: Stream for debounced search to avoid excessive API calls
  private patientNameSubject = new Subject<string>();
  //INFO: Stream for debounced doctor name filtering
  private doctorNameSubject = new Subject<string>();
  //INFO: Stream for debounced date range filtering
  private dateRangeSubject = new Subject<{ from?: string; to?: string }>();

  //INFO: Table column configuration
  private readonly allColumns: EntityTableColumn[] = [
    { name: 'Appointment#', prop: 'appointment_number', minWidth: 130 },
    { name: 'Patient', prop: 'patient_name', minWidth: 180 },
    { name: 'Doctor', prop: 'doctor_name', minWidth: 150 },
    { name: 'Specialty', prop: 'specialty_name', minWidth: 130 },
    { name: 'Location', prop: 'practice_location_name', minWidth: 150 },
    { name: 'Date', prop: 'appointment_date', type: 'date', width: 120 },
    { name: 'Time', prop: 'appointment_time', width: 100 },
    { name: 'Type', prop: 'appointment_type', width: 120 },
    { name: 'Status', prop: 'status', type: 'status', width: 120 },
    { name: 'Reason', prop: 'reason_for_visit', minWidth: 150 },
  ];

  get columns(): EntityTableColumn[] {
    if (!this.isDoctorRole) {
      return this.allColumns;
    }

    return this.allColumns.filter(
      (column) =>
        column.prop !== 'doctor_name' && column.prop !== 'specialty_name',
    );
  }

  readonly statusOptions: AppointmentStatus[] = [
    'Scheduled',
    'Confirmed',
    'Checked In',
    'In Progress',
    'Completed',
    'Cancelled',
    'No Show',
    'Rescheduled',
  ];

  readonly appointmentTypeOptions: AppointmentType[] = [
    'New Patient',
    'Follow-up',
    'Consultation',
    'Procedure',
    'Telehealth',
    'Emergency',
    'Routine Checkup',
    'Post-op Follow-up',
  ];

  //INFO: Data state
  appointments: Appointment[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  //INFO: Filter options (extracted from appointments)
  specialties: { id: string; name: string }[] = [];
  locations: { id: string; name: string }[] = [];

  //INFO: Track if initial load is complete to populate filter options
  private isInitialLoadComplete = false;

  //INFO: Filters state
  private readonly defaultFilters: AppointmentFilters = {
    patient_name: '',
    doctor_name: '',
    specialty_id: undefined,
    appointment_type: undefined,
    status: undefined,
    practice_location_id: undefined,
    created_by: undefined,
    date_from: undefined,
    date_to: undefined,
  };

  filters: AppointmentFilters = { ...this.defaultFilters };

  //INFO: Modal state
  isUpdateModalOpen = false;
  isDeleteModalOpen = false;
  selectedAppointment: Appointment | null = null;
  isDeleting = false;

  get isDoctorRole(): boolean {
    return this.authService.isDoctor();
  }

  get canCreateAppointments(): boolean {
    if (this.authService.isAdmin()) return true;
    if (this.authService.isDoctor()) return false;
    if (this.authService.isFdo()) {
      return this.authService.hasPermission(FDO_PERMISSIONS.CREATE_APPOINTMENT);
    }

    return false;
  }

  get canDeleteAppointments(): boolean {
    if (this.authService.isAdmin()) return true;
    if (this.authService.isDoctor()) return false;
    if (this.authService.isFdo()) {
      return this.authService.hasPermission(FDO_PERMISSIONS.UPDATE_APPOINTMENT);
    }

    return false;
  }

  get canUpdateAppointments(): boolean {
    if (this.authService.isAdmin() || this.authService.isDoctor()) return true;
    if (this.authService.isFdo()) {
      return this.authService.hasPermission(FDO_PERMISSIONS.UPDATE_APPOINTMENT);
    }

    return false;
  }

  get canExportAppointments(): boolean {
    if (this.authService.isAdmin()) return true;
    if (this.authService.isDoctor()) return false;
    if (!this.authService.isFdo()) return false;
    return this.authService.hasPermission(FDO_PERMISSIONS.EXPORT_APPOINTMENTS);
  }

  ngOnInit(): void {
    // Load all appointments without filters first to populate options
    this.loadAllAppointmentsForOptions();
    this.setupFilterSubscriptions();
  }

  //INFO: Load appointments without filters to populate specialty/location dropdowns
  private loadAllAppointmentsForOptions(): void {
    this.appointmentService
      .getAppointments({ per_page: this.dropdownPageSize })
      .subscribe({
        next: (response) => {
          this.extractFilterOptions(response.data);
          this.isInitialLoadComplete = true;
          // Now load with filters applied
          this.loadAppointments();
        },
        error: () => {
          this.isInitialLoadComplete = true;
          this.loadAppointments();
        },
      });
  }

  //INFO: Setup filter subscriptions
  private setupFilterSubscriptions(): void {
    //INFO: Patient name debouncing (300ms)
    this.patientNameSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((patientName) => {
        this.filters.patient_name = patientName;
        this.currentPage = 1;
        this.loadAppointments();
      });

    //INFO: Doctor name debouncing (300ms)
    this.doctorNameSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((doctorName) => {
        this.filters.doctor_name = doctorName;
        this.currentPage = 1;
        this.loadAppointments();
      });

    //INFO: Date range debouncing (300ms)
    this.dateRangeSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe(({ from, to }) => {
        this.filters.date_from = from;
        this.filters.date_to = to;
        this.currentPage = 1;
        this.loadAppointments();
      });
  }

  //INFO: Core method to fetch appointments from service
  loadAppointments(): void {
    this.loading = true;
    const fetchFilters: AppointmentFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    // Clean empty values from filters
    if (!fetchFilters.patient_name) delete fetchFilters.patient_name;
    if (!fetchFilters.doctor_name) delete fetchFilters.doctor_name;
    if (!fetchFilters.date_from) delete fetchFilters.date_from;
    if (!fetchFilters.date_to) delete fetchFilters.date_to;
    if (!fetchFilters.specialty_id) delete fetchFilters.specialty_id;
    if (!fetchFilters.practice_location_id)
      delete fetchFilters.practice_location_id;
    if (!fetchFilters.created_by) delete fetchFilters.created_by;

    if (this.isDoctorRole) {
      delete fetchFilters.doctor_name;
      delete fetchFilters.specialty_id;
    }

    //INFO: Defensive cleanup in case select emits string "undefined" from template bindings.
    if (
      !fetchFilters.appointment_type ||
      fetchFilters.appointment_type ===
        ('undefined' as unknown as AppointmentType)
    ) {
      delete fetchFilters.appointment_type;
    }

    if (
      !fetchFilters.status ||
      fetchFilters.status === ('undefined' as unknown as AppointmentStatus)
    ) {
      delete fetchFilters.status;
    }

    this.appointmentService.getAppointments(fetchFilters).subscribe({
      next: (response) => {
        this.appointments = response.data;
        this.totalCount = response.meta.total;
        this.loading = false;

        //INFO: Merge any new specialties/locations found (in case initial load didn't get all)
        // This ensures we never lose options when filtering
        this.extractFilterOptions(response.data, true);
      },

      error: () => {
        this.appointments = [];
        this.totalCount = 0;
        this.loading = false;
      },
    });
  }

  //INFO: Extract unique specialties and locations, optionally merging with existing
  private extractFilterOptions(
    appointmentData: Appointment[],
    merge = false,
  ): void {
    const specialtyMap = new Map<string, string>();
    const locationMap = new Map<string, string>();

    // If merging, start with existing options
    if (merge) {
      this.specialties.forEach((spec) => specialtyMap.set(spec.id, spec.name));
      this.locations.forEach((loc) => locationMap.set(loc.id, loc.name));
    }

    appointmentData.forEach((apt) => {
      if (apt.specialty_id && apt.specialty_name) {
        specialtyMap.set(apt.specialty_id, apt.specialty_name);
      }
      if (apt.practice_location_id && apt.practice_location_name) {
        locationMap.set(apt.practice_location_id, apt.practice_location_name);
      }
    });

    this.specialties = Array.from(specialtyMap, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name));

    this.locations = Array.from(locationMap, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  //INFO: Event handlers for UI interactions
  onPatientNameSearch(query: string): void {
    this.patientNameSubject.next(query);
  }

  onDoctorNameSearch(query: string): void {
    this.doctorNameSubject.next(query);
  }

  onDateRangeChange(): void {
    this.dateRangeSubject.next({
      from: this.filters.date_from,
      to: this.filters.date_to,
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAppointments();
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadAppointments();
  }

  private areFiltersDefault(): boolean {
    return (
      (this.filters.patient_name || '').trim() === '' &&
      (this.filters.doctor_name || '').trim() === '' &&
      !this.filters.specialty_id &&
      !this.filters.appointment_type &&
      !this.filters.status &&
      !this.filters.practice_location_id &&
      !this.filters.created_by &&
      !this.filters.date_from &&
      !this.filters.date_to
    );
  }

  onPageChange(event: { offset: number; limit: number }): void {
    this.currentPage = event.offset + 1;
    this.pageSize = event.limit;
    this.loadAppointments();
  }

  onRowSelected(row: Appointment): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1];

    //INFO: Use absolute role path to ensure detail route opens reliably from any appointments list context.
    this.router.navigate([`/${rolePrefix || 'admin'}/appointments`, row.id]);
  }

  //INFO: Modal management
  openUpdateModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.isUpdateModalOpen = true;

    this.appointmentService.getAppointmentById(appointment.id).subscribe({
      next: (response) => {
        if (!this.isUpdateModalOpen) {
          return;
        }

        this.selectedAppointment = response.data;
      },
      error: () => {
        this.toastService.error('Unable to load latest appointment details.');
      },
    });
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.selectedAppointment = null;
  }

  onUpdateSuccess(updatedAppointment: Appointment): void {
    this.closeUpdateModal();
    this.loadAppointments();
  }

  openDeleteModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedAppointment = null;
  }

  cancelAppointment(): void {
    if (!this.selectedAppointment) return;

    this.isDeleting = true;
    this.appointmentService
      .cancelAppointment(this.selectedAppointment.id)
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.isDeleteModalOpen = false;
          this.toastService.success('Appointment cancelled successfully');
          this.selectedAppointment = null;
          this.loadAppointments();
        },
        error: () => {
          this.isDeleting = false;
        },
      });
  }

  exportAppointmentsToExcel(): void {
    if (!this.canExportAppointments) {
      this.toastService.error(
        'You do not have permission to export appointments',
      );
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No appointment data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.appointmentService.getAppointments(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((appointment) => ({
          'Appointment ID': appointment.id,
          'Appointment Number': appointment.appointment_number ?? '',
          Patient: appointment.patient_name ?? '',
          Doctor: appointment.doctor_name ?? '',
          Specialty: appointment.specialty_name ?? '',
          Location: appointment.practice_location_name ?? '',
          Date: appointment.appointment_date ?? '',
          Time: appointment.appointment_time ?? '',
          Type: appointment.appointment_type ?? '',
          Status: appointment.status ?? '',
          'Reason for Visit': appointment.reason_for_visit ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info('No appointment data available to export');
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `appointments-${new Date().toISOString().slice(0, 10)}`,
          'Appointments',
        );

        this.toastService.success(
          'Appointments exported to Excel successfully',
        );
      },
      error: () => {
        this.toastService.error('Failed to export appointment data');
      },
    });
  }

  private buildExportFilters(): AppointmentFilters {
    const exportFilters: AppointmentFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.patient_name) delete exportFilters.patient_name;
    if (!exportFilters.doctor_name) delete exportFilters.doctor_name;
    if (!exportFilters.date_from) delete exportFilters.date_from;
    if (!exportFilters.date_to) delete exportFilters.date_to;
    if (!exportFilters.specialty_id) delete exportFilters.specialty_id;
    if (!exportFilters.practice_location_id)
      delete exportFilters.practice_location_id;
    if (!exportFilters.created_by) delete exportFilters.created_by;

    if (!exportFilters.appointment_type) delete exportFilters.appointment_type;
    if (!exportFilters.status) delete exportFilters.status;

    if (this.isDoctorRole) {
      delete exportFilters.doctor_name;
      delete exportFilters.specialty_id;
    }

    return exportFilters;
  }
}
