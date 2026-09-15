import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PracticeLocation,
  PracticeLocationFilters,
} from '../../../core/models/practice-location.model';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import { PracticeLocationService } from '../../../core/services/practice-location.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { PracticeLocationFormComponent } from '../practice-location-form/practice-location-form.component';

@Component({
  selector: 'app-practice-location-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityTableComponent,
    ConfirmDialogComponent,
    PracticeLocationFormComponent,
    RouterLink,
  ],
  templateUrl: './practice-location-list.component.html',
})
export class PracticeLocationListComponent implements OnInit {
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly filterDebounceMs = environment.filterDebounceMs;

  private readonly searchSubject = new Subject<string>();

  readonly columns: EntityTableColumn[] = [
    { name: 'Location Name', prop: 'location_name', minWidth: 240 },
    { name: 'City', prop: 'city', width: 140 },
    { name: 'State', prop: 'state', width: 120 },
    { name: 'Phone', prop: 'phone', minWidth: 160 },
    { name: 'Status', prop: 'status_label', type: 'status', width: 130 },
    { name: 'Created', prop: 'created_at', type: 'date', width: 140 },
  ];

  practiceLocations: Array<
    PracticeLocation & {
      status_label: string;
    }
  > = [];

  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  private readonly defaultFilters: PracticeLocationFilters = {
    search: '',
    is_active: undefined,
  };

  filters: PracticeLocationFilters = { ...this.defaultFilters };

  isUpdateModalOpen = false;
  isLoadingSelectedPracticeLocation = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  selectedPracticeLocation: PracticeLocation | null = null;

  get canCreatePracticeLocations(): boolean {
    return this.authService.isAdmin();
  }

  get canUpdatePracticeLocations(): boolean {
    return this.authService.isAdmin();
  }

  get canDeletePracticeLocations(): boolean {
    return this.authService.isAdmin();
  }

  get canExportPracticeLocations(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadPracticeLocations();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((search) => {
        this.filters.search = search;
        this.currentPage = 1;
        this.loadPracticeLocations();
      });
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      return value === '1' || value.toLowerCase() === 'true';
    }

    return false;
  }

  loadPracticeLocations(): void {
    this.loading = true;

    const fetchFilters: PracticeLocationFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    if (!fetchFilters.search) {
      delete fetchFilters.search;
    }

    if (typeof fetchFilters.is_active !== 'boolean') {
      delete fetchFilters.is_active;
    }

    this.practiceLocationService.getPracticeLocations(fetchFilters).subscribe({
      next: (response) => {
        this.practiceLocations = response.data.map((practiceLocation) => ({
          ...practiceLocation,
          status_label: this.normalizeBoolean(practiceLocation.is_active)
            ? 'active'
            : 'inactive',
        }));
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.practiceLocations = [];
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
    this.loadPracticeLocations();
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadPracticeLocations();
  }

  private areFiltersDefault(): boolean {
    return (
      (this.filters.search || '').trim() === '' &&
      typeof this.filters.is_active !== 'boolean'
    );
  }

  onPageChange(event: { offset: number; limit: number }): void {
    this.currentPage = event.offset + 1;
    this.pageSize = event.limit;
    this.loadPracticeLocations();
  }

  onRowSelected(row: PracticeLocation): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/practice-locations`, row.id]);
  }

  onUpdateRequested(row: PracticeLocation): void {
    this.selectedPracticeLocation = null;
    this.isUpdateModalOpen = true;
    this.isLoadingSelectedPracticeLocation = true;

    this.practiceLocationService.getPracticeLocationById(row.id).subscribe({
      next: (response) => {
        this.selectedPracticeLocation = response.data;
        this.isLoadingSelectedPracticeLocation = false;
      },
      error: () => {
        this.isLoadingSelectedPracticeLocation = false;
        this.toastService.error(
          'Unable to load practice location details for editing.',
        );
        this.closeUpdateModal();
      },
    });
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.isLoadingSelectedPracticeLocation = false;
    this.selectedPracticeLocation = null;
  }

  onUpdateSuccess(_practiceLocation: PracticeLocation): void {
    this.closeUpdateModal();
    this.loadPracticeLocations();
  }

  onDeleteRequested(row: PracticeLocation): void {
    this.selectedPracticeLocation = row;
    this.isDeleteModalOpen = true;
  }

  onDeleteModalChange(open: boolean): void {
    this.isDeleteModalOpen = open;

    if (!open) {
      this.selectedPracticeLocation = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedPracticeLocation) {
      return;
    }

    this.isDeleting = true;

    this.practiceLocationService
      .deletePracticeLocation(this.selectedPracticeLocation.id)
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.isDeleteModalOpen = false;
          this.selectedPracticeLocation = null;
          this.loadPracticeLocations();
        },
        error: () => {
          this.isDeleting = false;
        },
      });
  }

  exportPracticeLocationsToExcel(): void {
    if (!this.canExportPracticeLocations) {
      this.toastService.error(
        'You do not have permission to export practice locations',
      );
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No practice location data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.practiceLocationService.getPracticeLocations(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((practiceLocation) => ({
          'Location ID': practiceLocation.id,
          'Location Name': practiceLocation.location_name ?? '',
          Address: practiceLocation.address ?? '',
          City: practiceLocation.city ?? '',
          State: practiceLocation.state ?? '',
          ZIP: practiceLocation.zip ?? '',
          Phone: practiceLocation.phone ?? '',
          Email: practiceLocation.email ?? '',
          Status: this.normalizeBoolean(practiceLocation.is_active)
            ? 'Active'
            : 'Inactive',
          'Created At': practiceLocation.created_at ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info(
            'No practice location data available to export',
          );
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `practice-locations-${new Date().toISOString().slice(0, 10)}`,
          'PracticeLocations',
        );

        this.toastService.success(
          'Practice locations exported to Excel successfully',
        );
      },
      error: () => {
        this.toastService.error('Failed to export practice location data');
      },
    });
  }

  private buildExportFilters(): PracticeLocationFilters {
    const exportFilters: PracticeLocationFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.search) {
      delete exportFilters.search;
    }

    if (typeof exportFilters.is_active !== 'boolean') {
      delete exportFilters.is_active;
    }

    return exportFilters;
  }
}
