import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Insurance } from '../../../core/models/insurance.model';
import { InsuranceService } from '../../../core/services/insurance.service';

@Component({
  selector: 'app-insurance-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insurance-detail.component.html',
})
export class InsuranceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly insuranceService = inject(InsuranceService);
  private readonly location = inject(Location);

  insurance: Insurance | null = null;
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

    this.insuranceService.getInsuranceById(id).subscribe({
      next: (response) => {
        this.insurance = response.data.insurance;
        this.loading = false;
      },
      error: () => {
        this.insurance = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get statusLabel(): string {
    return this.normalizeBoolean(this.insurance?.is_active)
      ? 'active'
      : 'inactive';
  }

  get statusBadgeClass(): string {
    return this.normalizeBoolean(this.insurance?.is_active)
      ? 'badge-success'
      : 'badge-neutral';
  }

  get addresses() {
    if (!this.insurance) {
      return [];
    }

    if (this.insurance.addresses && this.insurance.addresses.length > 0) {
      return this.insurance.addresses;
    }

    return this.insurance.primary_address
      ? [this.insurance.primary_address]
      : [];
  }
}
