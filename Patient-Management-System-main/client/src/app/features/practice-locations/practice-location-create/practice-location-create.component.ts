import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PracticeLocationFormComponent } from '../practice-location-form/practice-location-form.component';

@Component({
  selector: 'app-practice-location-create',
  standalone: true,
  imports: [CommonModule, PracticeLocationFormComponent],
  templateUrl: './practice-location-create.component.html',
})
export class PracticeLocationCreateComponent {
  private readonly router = inject(Router);

  onSuccess(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/practice-locations`]);
  }

  onCancel(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/practice-locations`]);
  }
}
