import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorFormComponent } from '../doctor-form/doctor-form.component';
import { DoctorUser } from '../../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-create',
  standalone: true,
  imports: [CommonModule, DoctorFormComponent],
  templateUrl: './doctor-create.component.html',
})
export class DoctorCreateComponent {
  private readonly router = inject(Router);

  onSuccess(_doctor: DoctorUser): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/doctors`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/doctors`]);
  }
}
