import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirmFormComponent } from '../firm-form/firm-form.component';

@Component({
  selector: 'app-firm-create',
  standalone: true,
  imports: [CommonModule, FirmFormComponent],
  templateUrl: "./firm-create.component.html"
})
export class FirmCreateComponent {
  private router = inject(Router);

  onSuccess(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/firms`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/firms`]);
  }
}
