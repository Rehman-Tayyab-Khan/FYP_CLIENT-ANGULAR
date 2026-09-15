import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Specialty } from '../../../core/models/specialty.model';
import { SpecialtyService } from '../../../core/services/specialty.service';

@Component({
  selector: 'app-specialty-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './specialty-detail.component.html',
})
export class SpecialtyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly location = inject(Location);

  specialty: Specialty | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.specialtyService.getSpecialtyById(id).subscribe({
      next: (response) => {
        this.specialty = response.data.specialty;
        this.loading = false;
      },
      error: () => {
        this.specialty = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get statusLabel(): string {
    return this.specialty?.is_active ? 'active' : 'inactive';
  }

  get statusBadgeClass(): string {
    return this.specialty?.is_active ? 'badge-success' : 'badge-neutral';
  }
}
