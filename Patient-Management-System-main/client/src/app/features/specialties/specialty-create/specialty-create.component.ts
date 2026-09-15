import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Specialty } from '../../../core/models/specialty.model';
import { SpecialtyFormComponent } from '../specialty-form/specialty-form.component';

@Component({
  selector: 'app-specialty-create',
  standalone: true,
  imports: [CommonModule, SpecialtyFormComponent],
  templateUrl: './specialty-create.component.html',
})
export class SpecialtyCreateComponent {
  private readonly router = inject(Router);

  onSuccess(_specialty: Specialty): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/specialties`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/specialties`]);
  }
}
