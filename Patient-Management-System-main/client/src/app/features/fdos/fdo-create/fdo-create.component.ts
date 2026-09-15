import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FdoFormComponent } from '../fdo-form/fdo-form.component';
import { FdoUser } from '../../../core/models/fdo.model';

@Component({
  selector: 'app-fdo-create',
  standalone: true,
  imports: [CommonModule, FdoFormComponent],
  templateUrl: './fdo-create.component.html',
})
export class FdoCreateComponent {
  private readonly router = inject(Router);

  onSuccess(_fdo: FdoUser): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/fdo`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/fdo`]);
  }
}
