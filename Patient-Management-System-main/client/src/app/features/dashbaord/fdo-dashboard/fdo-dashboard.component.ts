import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardService,
  FdoDashboardStats,
} from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-fdo-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fdo-dashboard.component.html',
})
export class FdoDashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  stats: FdoDashboardStats | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.dashboardService.getFdoStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching FDO dashboard stats:', error);
        this.errorMessage =
          'Unable to load front desk dashboard right now. Please refresh and try again.';
        this.loading = false;
      },
    });
  }

  get maxTrendCount(): number {
    const counts =
      this.stats?.appointmentsTrend?.map((item) => item.count) ?? [];
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    return max > 0 ? max : 1;
  }

  statusBadgeClass(status: string | null | undefined): string {
    const value = (status ?? '').toLowerCase();

    if (value === 'scheduled' || value === 'confirmed') return 'badge-info';
    if (value === 'checked in' || value === 'in progress')
      return 'badge-warning';
    if (value === 'completed') return 'badge-success';
    if (value === 'cancelled' || value === 'no show') return 'badge-error';

    return 'badge-ghost';
  }
}
