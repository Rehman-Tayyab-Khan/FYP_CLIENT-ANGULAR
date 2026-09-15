import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import {
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../../environments/environment';
import { FdoFilters, FdoUser } from '../../../core/models/fdo.model';
import { FdoService } from '../../../core/services/fdo.service';
import { FdoFormComponent } from '../fdo-form/fdo-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-fdo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityTableComponent,
    ConfirmDialogComponent,
    FdoFormComponent,
    RouterLink,
  ],
  templateUrl: './fdo-list.component.html',
})
export class FdoListComponent implements OnInit {
  private readonly fdoService = inject(FdoService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly filterDebounceMs = environment.filterDebounceMs;

  private readonly searchSubject = new Subject<string>();

  fdos: Array<FdoUser & { full_name: string; status_label: string }> = [];
  readonly columns: EntityTableColumn[] = [
    { name: 'Name', prop: 'full_name', minWidth: 200 },
    { name: 'Email', prop: 'email', minWidth: 230 },
    { name: 'Phone', prop: 'phone', minWidth: 140 },
    { name: 'Status', prop: 'status_label', type: 'status', width: 130 },
    { name: 'Created', prop: 'created_at', type: 'date', width: 140 },
  ];

  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  private readonly defaultFilters: FdoFilters = {
    search: '',
    is_active: undefined,
  };

  filters: FdoFilters = { ...this.defaultFilters };

  isUpdateModalOpen = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  selectedFdo: FdoUser | null = null;
  selectedFdoId: string | null = null;

  get canExportFdos(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadFdos();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((search) => {
        this.filters.search = search;
        this.currentPage = 1;
        this.loadFdos();
      });
  }

  loadFdos(): void {
    this.loading = true;

    const fetchFilters: FdoFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    if (!fetchFilters.search) delete fetchFilters.search;
    if (typeof fetchFilters.is_active !== 'boolean')
      delete fetchFilters.is_active;

    this.fdoService.getFdos(fetchFilters).subscribe({
      next: (response) => {
        this.fdos = response.data.map((fdo) => ({
          ...fdo,
          full_name: `${fdo.first_name} ${fdo.last_name}`.trim(),
          status_label: fdo.is_active ? 'active' : 'inactive',
        }));
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.fdos = [];
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
    this.loadFdos();
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadFdos();
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
    this.loadFdos();
  }

  onRowSelected(row: FdoUser): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/fdo`, row.id]);
  }

  onUpdateRequested(row: FdoUser): void {
    this.selectedFdoId = row.id;
    this.isUpdateModalOpen = true;
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.selectedFdoId = null;
  }

  onUpdateSuccess(_fdo: FdoUser): void {
    this.closeUpdateModal();
    this.loadFdos();
  }

  onDeleteRequested(row: FdoUser): void {
    this.selectedFdo = row;
    this.isDeleteModalOpen = true;
  }

  onDeleteModalChange(open: boolean): void {
    this.isDeleteModalOpen = open;
    if (!open) {
      this.selectedFdo = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedFdo) {
      return;
    }

    this.isDeleting = true;
    this.fdoService.deleteFdo(this.selectedFdo.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.toastService.success('FDO archived successfully');
        this.selectedFdo = null;
        this.loadFdos();
      },
      error: () => {
        this.isDeleting = false;
      },
    });
  }

  exportFdosToExcel(): void {
    if (!this.canExportFdos) {
      this.toastService.error('You do not have permission to export FDOs');
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No FDO data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.fdoService.getFdos(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((fdo) => ({
          'FDO ID': fdo.id,
          'First Name': fdo.first_name ?? '',
          'Last Name': fdo.last_name ?? '',
          Email: fdo.email ?? '',
          Phone: fdo.phone ?? '',
          Status: fdo.is_active ? 'Active' : 'Inactive',
          'Created At': fdo.created_at ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info('No FDO data available to export');
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `fdos-${new Date().toISOString().slice(0, 10)}`,
          'FDOs',
        );

        this.toastService.success('FDOs exported to Excel successfully');
      },
      error: () => {
        this.toastService.error('Failed to export FDO data');
      },
    });
  }

  private buildExportFilters(): FdoFilters {
    const exportFilters: FdoFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.search) delete exportFilters.search;
    if (typeof exportFilters.is_active !== 'boolean') {
      delete exportFilters.is_active;
    }

    return exportFilters;
  }
}
