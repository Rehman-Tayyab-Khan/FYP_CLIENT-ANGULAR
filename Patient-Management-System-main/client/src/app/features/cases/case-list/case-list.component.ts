import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CaseService } from '../../../core/services/case.service';
import { environment } from '../../../../environments/environment';
import {
  Case,
  CaseCategory,
  CaseFilters,
  CasePriority,
  CaseStatus,
  CaseType,
} from '../../../core/models/case.model';
import {
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CaseFormComponent } from '../case-form/case-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { FDO_PERMISSIONS } from '../../../core/constants/fdo-permissions';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EntityTableComponent,
    ConfirmDialogComponent,
    CaseFormComponent,
  ],
  templateUrl: './case-list.component.html',
})
export class CaseListComponent implements OnInit {
  private readonly caseService = inject(CaseService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly excelExportService = inject(ExcelExportService);
  private readonly filterDebounceMs = environment.filterDebounceMs;

  private searchSubject = new Subject<string>();
  private openingDateRangeSubject = new Subject<{
    from?: string;
    to?: string;
  }>();

  readonly columns: EntityTableColumn[] = [
    { name: 'Case #', prop: 'case_number', width: 140 },
    { name: 'Patient', prop: 'patient_name', minWidth: 200 },
    { name: 'Category', prop: 'category', width: 130 },
    { name: 'Type', prop: 'case_type', width: 150 },
    { name: 'Priority', prop: 'priority', width: 120 },
    { name: 'Status', prop: 'case_status', type: 'status', width: 130 },
    { name: 'Opening Date', prop: 'opening_date', type: 'date', width: 120 },
  ];

  cases: Case[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 15;
  currentPage = 1;

  readonly statusOptions = Object.values(CaseStatus);
  readonly priorityOptions = Object.values(CasePriority);
  readonly categoryOptions = Object.values(CaseCategory);
  readonly typeOptions = Object.values(CaseType);

  private readonly defaultFilters: CaseFilters = {
    search: '',
    case_status: undefined,
    priority: undefined,
    category: undefined,
    case_type: undefined,
    opening_date_from: undefined,
    opening_date_to: undefined,
  };

  filters: CaseFilters = { ...this.defaultFilters };

  isUpdateModalOpen = false;
  isDeleteModalOpen = false;
  selectedCase: Case | null = null;
  isDeleting = false;

  get canCreateCases(): boolean {
    if (this.authService.isAdmin()) return true;
    if (!this.authService.isFdo()) return false;
    return this.authService.hasPermission(FDO_PERMISSIONS.CREATE_CASE);
  }

  get canUpdateCases(): boolean {
    if (this.authService.isAdmin()) return true;
    if (!this.authService.isFdo()) return false;
    return this.authService.hasPermission(FDO_PERMISSIONS.UPDATE_CASE);
  }

  get canDeleteCases(): boolean {
    return this.authService.isAdmin();
  }

  get canExportCases(): boolean {
    if (this.authService.isAdmin()) return true;
    if (this.authService.isDoctor()) return false;
    if (!this.authService.isFdo()) return false;
    return this.authService.hasPermission(FDO_PERMISSIONS.EXPORT_CASES);
  }

  ngOnInit(): void {
    this.loadCases();

    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((query) => {
        this.filters.search = query;
        this.currentPage = 1;
        this.loadCases();
      });

    this.openingDateRangeSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe(({ from, to }) => {
        this.filters.opening_date_from = from;
        this.filters.opening_date_to = to;
        this.currentPage = 1;
        this.loadCases();
      });
  }

  loadCases(): void {
    this.loading = true;
    const fetchFilters: CaseFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    if (!fetchFilters.search) delete fetchFilters.search;
    if (!fetchFilters.case_status) delete fetchFilters.case_status;
    if (!fetchFilters.priority) delete fetchFilters.priority;
    if (!fetchFilters.category) delete fetchFilters.category;
    if (!fetchFilters.case_type) delete fetchFilters.case_type;
    if (!fetchFilters.opening_date_from) delete fetchFilters.opening_date_from;
    if (!fetchFilters.opening_date_to) delete fetchFilters.opening_date_to;

    this.caseService.getCases(fetchFilters).subscribe({
      next: (response) => {
        this.cases = response.data.map(
          (c: any) =>
            ({
              ...c,
              patient_name: c.patient
                ? `${c.patient.first_name} ${c.patient.last_name}`
                : c.patient_name || 'N/A',
              practice_location_name:
                c.practiceLocation?.location_name ||
                c.practice_location_name ||
                '',
              insurance_name:
                c.insurance?.insurance_name || c.insurance_name || '',
              firm_name: c.firm?.firm_name || c.firm_name || '',
            }) as Case,
        );
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.cases = [];
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
    this.loadCases();
  }

  onOpeningDateRangeChange(): void {
    this.openingDateRangeSubject.next({
      from: this.filters.opening_date_from,
      to: this.filters.opening_date_to,
    });
  }

  resetFilters(): void {
    if (this.areFiltersDefault() && this.currentPage === 1) {
      return;
    }

    this.filters = { ...this.defaultFilters };
    this.currentPage = 1;
    this.loadCases();
  }

  private areFiltersDefault(): boolean {
    return (
      (this.filters.search || '').trim() === '' &&
      !this.filters.case_status &&
      !this.filters.priority &&
      !this.filters.category &&
      !this.filters.case_type &&
      !this.filters.opening_date_from &&
      !this.filters.opening_date_to
    );
  }

  onPageChange(event: { offset: number; limit: number }): void {
    this.currentPage = event.offset + 1;
    this.pageSize = event.limit;
    this.loadCases();
  }

  onRowSelected(row: Case): void {
    if (!row?.id) {
      return;
    }

    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/cases`, row.id]);
  }

  // --- Modal Management ---

  openUpdateModal(row: Case): void {
    this.selectedCase = row;
    this.isUpdateModalOpen = true;
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.selectedCase = null;
  }

  onUpdateSuccess(updatedCase: Case): void {
    this.closeUpdateModal();
    this.loadCases();
  }

  openDeleteModal(row: Case): void {
    this.selectedCase = row;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedCase = null;
  }

  confirmDelete(): void {
    if (!this.selectedCase) return;

    this.isDeleting = true;
    this.caseService.deleteCase(this.selectedCase.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.toastService.success('Case record deleted successfully');
        this.selectedCase = null;
        this.loadCases();
      },
      error: () => {
        this.isDeleting = false;
      },
    });
  }

  exportCasesToExcel(): void {
    if (!this.canExportCases) {
      this.toastService.error('You do not have permission to export cases');
      return;
    }

    if (this.totalCount === 0) {
      this.toastService.info('No case data available to export');
      return;
    }

    const exportFilters = this.buildExportFilters();

    this.caseService.getCases(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((patientCase) => ({
          'Case ID': patientCase.id,
          'Case Number': patientCase.case_number ?? '',
          Patient: patientCase.patient
            ? `${patientCase.patient.first_name ?? ''} ${patientCase.patient.last_name ?? ''}`.trim()
            : '',
          Category: patientCase.category ?? '',
          'Case Type': patientCase.case_type ?? '',
          Priority: patientCase.priority ?? '',
          Status: patientCase.case_status ?? '',
          'Opening Date': patientCase.opening_date ?? '',
          'Closing Date': patientCase.closing_date ?? '',
          'Purpose of Visit': patientCase.purpose_of_visit ?? '',
        }));

        if (exportRows.length === 0) {
          this.toastService.info('No case data available to export');
          return;
        }

        this.excelExportService.exportJsonAsExcel(
          exportRows,
          `cases-${new Date().toISOString().slice(0, 10)}`,
          'Cases',
        );

        this.toastService.success('Cases exported to Excel successfully');
      },
      error: () => {
        this.toastService.error('Failed to export case data');
      },
    });
  }

  private buildExportFilters(): CaseFilters {
    const exportFilters: CaseFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.search) delete exportFilters.search;
    if (!exportFilters.case_status) delete exportFilters.case_status;
    if (!exportFilters.priority) delete exportFilters.priority;
    if (!exportFilters.category) delete exportFilters.category;
    if (!exportFilters.case_type) delete exportFilters.case_type;
    if (!exportFilters.opening_date_from)
      delete exportFilters.opening_date_from;
    if (!exportFilters.opening_date_to) delete exportFilters.opening_date_to;

    return exportFilters;
  }
}
