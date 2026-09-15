import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardService,
  DoctorDashboardStats,
} from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css'],
})
export class DoctorDashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  stats: DoctorDashboardStats | null = null;
  loading = true;

  ngOnInit(): void {
    this.dashboardService.getDoctorStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching doctor dashboard stats:', error);
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
