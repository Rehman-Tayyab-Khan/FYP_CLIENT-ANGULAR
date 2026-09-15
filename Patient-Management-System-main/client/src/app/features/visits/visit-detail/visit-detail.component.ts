import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VisitService } from '../../../core/services/visit.service';
import { Visit } from '../../../core/models/visit.model';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visit-detail.component.html',
})
export class VisitDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly visitService = inject(VisitService);
  private readonly location = inject(Location);

  visit: Visit | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.visitService.getVisitById(id).subscribe({
      next: (response) => {
        this.visit = response.data;
        this.loading = false;
      },
      error: () => {
        this.visit = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get statusBadgeClass(): string {
    const value = this.visit?.visit_status?.toLowerCase();

    if (value === 'draft') return 'badge-warning';
    if (value === 'completed') return 'badge-success';
    if (value === 'cancelled') return 'badge-error';
    if (value === 'billed') return 'badge-info';

    return 'badge-ghost';
  }
}
