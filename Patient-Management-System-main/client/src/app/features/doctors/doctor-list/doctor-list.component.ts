import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import {
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../../environments/environment';
import { DoctorFilters, DoctorUser } from '../../../core/models/doctor.model';
import { Specialty } from '../../../core/models/specialty.model';
import { PracticeLocation } from '../../../core/models/practice-location.model';
import { DoctorService } from '../../../core/services/doctor.service';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { PracticeLocationService } from '../../../core/services/practice-location.service';
import { DoctorFormComponent } from '../doctor-form/doctor-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityTableComponent,
    ConfirmDialogComponent,
    DoctorFormComponent,

    RouterLink,
  ],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorService = inject(DoctorService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly filterDebounceMs = environment.filterDebounceMs;

  private readonly searchSubject = new Subject<string>();

  doctors: Array<
    DoctorUser & {
      full_name: string;
      status_label: string;
      specialty_name: string;
      practice_location_name: string;
    }
  > = [];

  specialties: Specialty[] = [];
  practiceLocations: PracticeLocation[] = [];

  readonly columns: EntityTableColumn[] = [
    { name: 'Name', prop: 'full_name', minWidth: 200 },
    { name: 'Email', prop: 'email', minWidth: 230 },
    { name: 'Phone', prop: 'phone', minWidth: 140 },
    { name: 'Specialty', prop: 'specialty_name', minWidth: 180 },
    {
      name: 'Practice Location',
      prop: 'practice_location_name',
      minWidth: 190,
    },
    { name: 'Status', prop: 'status_label', type: 'status', width: 130 },
    { name: 'Created', prop: 'created_at', type: 'date', width: 140 },
  ];

  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  private readonly defaultFilters: DoctorFilters = {
    search: '',
    is_active: undefined,
    specialty_id: undefined,
    practice_location_id: undefined,
  };

  filters: DoctorFilters = { ...this.defaultFilters };

  isUpdateModalOpen = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  selectedDoctor: DoctorUser | null = null;
  selectedDoctorId: string | null = null;

  get canExportDoctors(): boolean {
    return this.authService.isAdmin();
  }

  get canCreateDoctor(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadFilterOptions();
    this.loadDoctors();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((search) => {
        this.filters.search = search;
        this.currentPage = 1;
        this.loadDoctors();
      });
  }

  private loadFilterOptions(): void {
    forkJoin({
      specialties: this.specialtyService.getSpecialties({
        per_page: 100,
        is_active: true,
      }),
      practiceLocations: this.practiceLocationService.getPracticeLocations({
        per_page: 100,
      }),
    }).subscribe({
      next: ({ specialties, practiceLocations }) => {
        this.specialties = specialties.data;
        this.practiceLocations = practiceLocations.data;
      },
      error: () => {
        this.specialties = [];
        this.practiceLocations = [];
      },
    });
  }

  loadDoctors(): void {
    this.loading = true;

    const fetchFilters: DoctorFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    if (!fetchFilters.search) delete fetchFilters.search;
    if (typeof fetchFilters.is_active !== 'boolean')
      delete fetchFilters.is_active;
    if (!fetchFilters.specialty_id) delete fetchFilters.specialty_id;
    if (!fetchFilters.practice_location_id)
      delete fetchFilters.practice_location_id;

    this.doctorService.getDoctors(fetchFilters).subscribe({
      next: (response) => {
        this.doctors = response.data.map((doctor) => ({
          ...doctor,
          full_name: `${doctor.first_name} ${doctor.last_name}`.trim(),
          status_label: doctor.is_active ? 'active' : 'inactive',
          specialty_name:
            doctor.doctorProfile?.specialty?.specialty_name ||
            doctor.doctorProfile?.specialty_id ||
            '-',
          practice_location_name:
            doctor.doctorProfile?.practiceLocation?.location_name ||
            doctor.doctorProfile?.practice_location_id ||
            '-',
        }));
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.doctors = [];
        this.totalCount = 0;
        this.loading = false;
      },
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadDoctors();
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadDoctors();
  }

  private areFiltersDefault(): boolean {
    return (
      (this.filters.search || '').trim() === '' &&
      typeof this.filters.is_active !== 'boolean' &&
      !this.filters.specialty_id &&
      !this.filters.practice_location_id
    );
  }

  onPageChange(event: { offset: number; limit: number }): void {
    this.currentPage = event.offset + 1;
    this.pageSize = event.limit;
    this.loadDoctors();
  }

  onRowSelected(row: DoctorUser): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/doctors`, row.id]);
  }

  onUpdateRequested(row: DoctorUser): void {
    this.selectedDoctorId = row.id;
    this.isUpdateModalOpen = true;
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.selectedDoctorId = null;
  }

  onUpdateSuccess(_doctor: DoctorUser): void {
    this.closeUpdateModal();
    this.loadDoctors();
  }

  onDeleteRequested(row: DoctorUser): void {
    this.selectedDoctor = row;
    this.isDeleteModalOpen = true;
  }

  onDeleteModalChange(open: boolean): void {
    this.isDeleteModalOpen = open;
    if (!open) {
      this.selectedDoctor = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedDoctor) {
      return;
    }

    this.isDeleting = true;
    this.doctorService.deleteDoctor(this.selectedDoctor.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.toastService.success('Doctor archived successfully');
        this.selectedDoctor = null;
        this.loadDoctors();
      },
      error: () => {
        this.isDeleting = false;
      },
    });
  }

  exportDoctorsToExcel(): void {
    if (!this.canExportDoctors) {
      this.toastService.error('You do not have permission to export doctors');
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No doctor data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.doctorService.getDoctors(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((doctor) => ({
          'Doctor ID': doctor.id,
          'First Name': doctor.first_name ?? '',
          'Last Name': doctor.last_name ?? '',
          Email: doctor.email ?? '',
          Phone: doctor.phone ?? '',
          Specialty: doctor.doctorProfile?.specialty?.specialty_name ?? '',
          'Practice Location':
            doctor.doctorProfile?.practiceLocation?.location_name ?? '',
          Status: doctor.is_active ? 'Active' : 'Inactive',
          'Created At': doctor.created_at ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info('No doctor data available to export');
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `doctors-${new Date().toISOString().slice(0, 10)}`,
          'Doctors',
        );

        this.toastService.success('Doctors exported to Excel successfully');
      },
      error: () => {
        this.toastService.error('Failed to export doctor data');
      },
    });
  }

  private buildExportFilters(): DoctorFilters {
    const exportFilters: DoctorFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.search) delete exportFilters.search;
    if (typeof exportFilters.is_active !== 'boolean') {
      delete exportFilters.is_active;
    }
    if (!exportFilters.specialty_id) delete exportFilters.specialty_id;
    if (!exportFilters.practice_location_id) {
      delete exportFilters.practice_location_id;
    }

    return exportFilters;
  }
}
