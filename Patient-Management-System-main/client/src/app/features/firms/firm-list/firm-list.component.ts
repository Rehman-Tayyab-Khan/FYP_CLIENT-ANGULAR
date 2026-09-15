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
  Firm,
  FirmFilters,
} from '../../../core/models/firm.model';
import { FirmService } from '../../../core/services/firm.service';
import { FirmFormComponent } from '../firm-form/firm-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';

@Component({
  selector: 'app-firm-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityTableComponent,
    FirmFormComponent,
    RouterLink,
  ],
  templateUrl: './firm-list.component.html',
})
export class FirmListComponent implements OnInit {
  private readonly firmService = inject(FirmService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly filterDebounceMs = environment.filterDebounceMs;
  private readonly excelService = inject(ExcelExportService);

  private readonly searchSubject = new Subject<string>();

  readonly columns: EntityTableColumn[] = [
    { name: 'Firm Name', prop: 'firm_name', minWidth: 240 },
    { name: 'Type', prop: 'firm_type', width: 130 },
    { name: 'Contact Person', prop: 'contact_person', minWidth: 180 },
    { name: 'Phone', prop: 'phone', width: 150 },
    { name: 'Status', prop: 'status_label', type: 'status', width: 130 },
    { name: 'Created', prop: 'created_at', type: 'date', width: 140 },
  ];

  firms: Array<
    Firm & {
      status_label: string;
    }
  > = [];

  loading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  filters: FirmFilters = {
    search: '',
    is_active: undefined,
  };

  isUpdateModalOpen = false;
  isLoadingSelectedFirm = false;
  selectedFirm: Firm | null = null;

  ngOnInit(): void {
    this.setupSearch();
    this.loadFirms();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(this.filterDebounceMs), distinctUntilChanged())
      .subscribe((search) => {
        this.filters.search = search;
        this.currentPage = 1;
        this.loadFirms();
      });
  }

  loadFirms(): void {
    this.loading = true;

    const fetchFilters: FirmFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize,
    };

    if (!fetchFilters.search) delete fetchFilters.search;
    if (typeof fetchFilters.is_active !== 'boolean') delete fetchFilters.is_active;

    this.firmService.getFirms(fetchFilters).subscribe({
      next: (response) => {
        this.firms = response.data.map((firm) => ({
          ...firm,
          status_label: !!firm.is_active ? 'active' : 'inactive',
        }));
        this.totalCount = response.meta.total;
        this.loading = false;
      },
      error: () => {
        this.firms = [];
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
    this.loadFirms();
  }

  onPageChange(event: { offset: number; limit: number }): void {
    this.currentPage = event.offset + 1;
    this.pageSize = event.limit;
    this.loadFirms();
  }

  onRowSelected(row: Firm): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/firms`, row.id]);
  }

  onUpdateRequested(row: Firm): void {
    this.selectedFirm = null;
    this.isUpdateModalOpen = true;
    this.isLoadingSelectedFirm = true;

    this.firmService.getFirmById(row.id).subscribe({
      next: (response) => {
        this.selectedFirm = response.data.firm;
        this.isLoadingSelectedFirm = false;
      },
      error: () => {
        this.isLoadingSelectedFirm = false;
        this.toastService.error('Unable to load firm details.');
        this.closeUpdateModal();
      },
    });
  }

  closeUpdateModal(): void {
    this.isUpdateModalOpen = false;
    this.selectedFirm = null;
  }
  exportExcel(): void {
    if (this.totalCount === 0) {
      this.toastService.info('No firm data available to export');
      return;
    }

    this.loading = true;

    const exportFilters: FirmFilters = {
      ...this.filters,
      page: 1,
      per_page: this.totalCount,
    };

    if (!exportFilters.search) delete exportFilters.search;
    if (typeof exportFilters.is_active !== 'boolean') delete exportFilters.is_active;

    this.firmService.getFirms(exportFilters).subscribe({
      next: (response) => {
        const exportRows = response.data.map((firm) => ({
          'Firm Name': firm.firm_name,
          'Firm Type': firm.firm_type,
          'Contact Person': firm.contact_person,
          Email: firm.email || '',
          Phone: firm.phone,
          Address: firm.address,
          Status: firm.is_active ? 'Active' : 'Inactive',
          'Created At': firm.created_at || '',
        }));

        this.excelService.exportJsonAsExcel(
          exportRows,
          `firms-${new Date().toISOString().slice(0, 10)}`,
          'Firms',
        );

        this.toastService.success('Firms exported to Excel successfully');
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to export firm data');
        this.loading = false;
      },
    });
  }
  onUpdateSuccess(): void {
    this.closeUpdateModal();
    this.loadFirms();
  }
}
