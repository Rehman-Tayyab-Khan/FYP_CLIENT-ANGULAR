import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PatientFormComponent } from '../patient-form/patient-form.component';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [CommonModule, PatientFormComponent],
  templateUrl: './patient-create.component.html',
})
export class PatientCreateComponent {
  private readonly router = inject(Router);

  onSuccess(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/patients`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/patients`]);
  }
}
