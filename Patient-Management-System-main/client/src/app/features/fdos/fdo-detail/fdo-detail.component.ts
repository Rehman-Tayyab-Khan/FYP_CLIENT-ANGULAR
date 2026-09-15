import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FdoUser } from '../../../core/models/fdo.model';
import { FdoService } from '../../../core/services/fdo.service';

@Component({
  selector: 'app-fdo-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fdo-detail.component.html',
})
export class FdoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fdoService = inject(FdoService);
  private readonly location = inject(Location);

  fdo: FdoUser | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.fdoService.getFdoById(id).subscribe({
      next: (response) => {
        this.fdo = response.data.user;
        this.loading = false;
      },
      error: () => {
        this.fdo = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get fullName(): string {
    if (!this.fdo) {
      return '-';
    }

    return `${this.fdo.first_name} ${this.fdo.last_name}`.trim();
  }

  get initials(): string {
    if (!this.fdo) {
      return '--';
    }

    const first = this.fdo.first_name?.charAt(0) || '';
    const last = this.fdo.last_name?.charAt(0) || '';

    return `${first}${last}`.toUpperCase();
  }

  get statusBadgeClass(): string {
    return this.fdo?.is_active ? 'badge-success' : 'badge-neutral';
  }

  get permissionLabels(): string[] {
    const permissions =
      this.fdo?.userPermissions
        ?.map((item) => item.permission?.permission_name || '')
        .map((permission) =>
          permission === 'view_doctor_schedules' ? 'view_doctors' : permission,
        )
        .filter(Boolean) || [];

    return permissions.map((permission) =>
      permission
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(' '),
    );
  }
}
