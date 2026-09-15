import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Case } from '../../../core/models/case.model';
import { CaseService } from '../../../core/services/case.service';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-detail.component.html',
})
export class CaseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly caseService = inject(CaseService);
  private readonly location = inject(Location);

  caseRecord: Case | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.caseService.getCaseById(id).subscribe({
      next: (response) => {
        const data = response.data as {
          case?: Case;
        };
        this.caseRecord = data.case!;
        this.loading = false;
      },
      error: () => {
        this.caseRecord = null;
        this.loading = false;
      },
    });
  }

  get patientName(): string {
    const patient = this.caseRecord?.patient;
    if (!patient) {
      return '-';
    }
    return `${patient.first_name} ${patient.last_name}`;
  }

  get statusBadgeClass(): string {
    const value = this.caseRecord?.case_status?.toLowerCase();
    if (value === 'active') return 'badge-success';
    if (value === 'on hold') return 'badge-warning';
    if (value === 'closed') return 'badge-neutral';
    if (value === 'transferred') return 'badge-info';
    if (value === 'cancelled') return 'badge-error';
    return 'badge-ghost';
  }

  goBack(): void {
    this.location.back();
  }
}
