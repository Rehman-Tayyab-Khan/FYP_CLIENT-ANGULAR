import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CaseFormComponent } from '../case-form/case-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { FDO_PERMISSIONS } from '../../../core/constants/fdo-permissions';

@Component({
  selector: 'app-case-create',
  standalone: true,
  imports: [CommonModule, CaseFormComponent],
  templateUrl: './case-create.component.html',
})
export class CaseCreateComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  onSuccess(_createdCase: unknown): void {
    this.navigateAfterExit();
  }

  onCancel(): void {
    this.navigateAfterExit();
  }

  private navigateAfterExit(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    if (rolePrefix !== 'fdo') {
      this.router.navigate([`/${rolePrefix}/cases`]);
      return;
    }

    if (this.auth.hasPermission(FDO_PERMISSIONS.VIEW_CASES)) {
      this.router.navigate(['/fdo/cases']);
      return;
    }

    if (this.auth.hasPermission(FDO_PERMISSIONS.CREATE_CASE)) {
      this.router.navigate(['/fdo/cases/new']);
      return;
    }

    this.router.navigate([this.auth.getFirstAllowedFdoRoute()]);
  }
}
