import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PracticeLocation } from '../../../core/models/practice-location.model';
import { PracticeLocationService } from '../../../core/services/practice-location.service';

@Component({
  selector: 'app-practice-location-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-location-detail.component.html',
})
export class PracticeLocationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly location = inject(Location);

  practiceLocation: PracticeLocation | null = null;
  loading = true;

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.practiceLocationService.getPracticeLocationById(id).subscribe({
      next: (response) => {
        this.practiceLocation = response.data;
        this.loading = false;
      },
      error: () => {
        this.practiceLocation = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get statusLabel(): string {
    return this.normalizeBoolean(this.practiceLocation?.is_active)
      ? 'active'
      : 'inactive';
  }

  get statusBadgeClass(): string {
    return this.normalizeBoolean(this.practiceLocation?.is_active)
      ? 'badge-success'
      : 'badge-neutral';
  }
}
