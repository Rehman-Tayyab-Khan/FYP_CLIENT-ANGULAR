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
import {
  Insurance,
  InsuranceFilters,
} from '../../../core/models/insurance.model';
import { InsuranceService } from '../../../core/services/insurance.service';
import { InsuranceFormComponent } from '../insurance-form/insurance-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-insurance-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityTableComponent,
    ConfirmDialogComponent,
    InsuranceFormComponent,
    RouterLink,
  ],
  templateUrl: './insurance-list.component.html',
})
export class InsuranceListComponent implements OnInit {
  private readonly insuranceService = inject(InsuranceService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly filterDebounceMs = environment.filterDebounceMs;

  private readonly searchSubject = new Subject<string>();

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

  readonly columns: EntityTableColumn[] = [
    { name: 'Insurance Name', prop: 'insurance_name', minWidth: 240 },
    { name: 'Insurance Code', prop: 'insurance_code', minWidth: 220 },
    { name: 'Status', prop: 'status_label', type: 'status', width: 130 },
    { name: 'Created', prop: 'created_at', type: 'date', width: 140 },
  ];

  insurances: Array<
    Insurance & {
      status_label: string;
    }
  > = [];

  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  private readonly defaultFilters: InsuranceFilters = {
    search: '',
    is_active: undefined,
  };

  filters: InsuranceFilters = { ...this.defaultFilters };

  isUpdateModalOpen = false;
  isLoadingSelectedInsurance = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  selectedInsurance: Insurance | null = null;

  get canExportInsurances(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadInsurances();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((search) => {
        this.filters.search = search;
        this.currentPage = 1;
        this.loadInsurances();
      });
  }

  loadInsurances(): void {
    this.loading = true;

    const fetchFilters: InsuranceFilters = {
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

    this.insuranceService.getInsurances(fetchFilters).subscribe({
      next: (response) => {
        this.insurances = response.data.map((insurance) => ({
          ...insurance,
          status_label: this.normalizeBoolean(insurance.is_active)
            ? 'active'
            : 'inactive',
        }));
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.insurances = [];
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
    this.loadInsurances();
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadInsurances();
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
    this.loadInsurances();
  }

  onRowSelected(row: Insurance): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/insurances`, row.id]);
  }

  onUpdateRequested(row: Insurance): void {
    this.selectedInsurance = null;
    this.isUpdateModalOpen = true;
    this.isLoadingSelectedInsurance = true;

    this.insuranceService.getInsuranceById(row.id).subscribe({
      next: (response) => {
        this.selectedInsurance = response.data.insurance;
        this.isLoadingSelectedInsurance = false;
      },
      error: () => {
        this.isLoadingSelectedInsurance = false;
        this.toastService.error('Unable to load insurance details for editing.');
        this.closeUpdateModal();
      },
    });
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.isLoadingSelectedInsurance = false;
    this.selectedInsurance = null;
  }

  onUpdateSuccess(_insurance: Insurance): void {
    this.closeUpdateModal();
    this.loadInsurances();
  }

  onDeleteRequested(row: Insurance): void {
    this.selectedInsurance = row;
    this.isDeleteModalOpen = true;
  }

  onDeleteModalChange(open: boolean): void {
    this.isDeleteModalOpen = open;

    if (!open) {
      this.selectedInsurance = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedInsurance) {
      return;
    }

    this.isDeleting = true;

    this.insuranceService.deleteInsurance(this.selectedInsurance.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.toastService.success('Insurance deleted successfully');
        this.selectedInsurance = null;
        this.loadInsurances();
      },
      error: () => {
        this.isDeleting = false;
      },
    });
  }

  exportInsurancesToExcel(): void {
    if (!this.canExportInsurances) {
      this.toastService.error('You do not have permission to export insurances');
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No insurance data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.insuranceService.getInsurances(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((insurance) => ({
          'Insurance ID': insurance.id,
          'Insurance Name': insurance.insurance_name ?? '',
          'Insurance Code': insurance.insurance_code ?? '',
          Status: this.normalizeBoolean(insurance.is_active)
            ? 'Active'
            : 'Inactive',
          'Primary Address': insurance.primary_address?.address ?? '',
          'Primary Phone': insurance.primary_address?.phone ?? '',
          'Created At': insurance.created_at ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info('No insurance data available to export');
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `insurances-${new Date().toISOString().slice(0, 10)}`,
          'Insurances',
        );

        this.toastService.success('Insurances exported to Excel successfully');
      },
      error: () => {
        this.toastService.error('Failed to export insurance data');
      },
    });
  }

  private buildExportFilters(): InsuranceFilters {
    const exportFilters: InsuranceFilters = {
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
