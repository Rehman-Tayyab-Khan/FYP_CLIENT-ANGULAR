import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Insurance } from '../../../core/models/insurance.model';
import { InsuranceFormComponent } from '../insurance-form/insurance-form.component';

@Component({
  selector: 'app-insurance-create',
  standalone: true,
  imports: [CommonModule, InsuranceFormComponent],
  templateUrl: './insurance-create.component.html',
})
export class InsuranceCreateComponent {
  private readonly router = inject(Router);

  onSuccess(_insurance: Insurance): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/insurances`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/insurances`]);
  }
}
