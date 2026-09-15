import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirmService } from '../../../core/services/firm.service';
import { Firm } from '../../../core/models/firm.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-firm-detail',
  imports: [CommonModule],
  templateUrl: './firm-detail.component.html'
})
export class FirmDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firmService = inject(FirmService);
  private toastService = inject(ToastService);

  firm: Firm | null = null;
  loading = true;

  get initials(): string {
    if (!this.firm?.firm_name) return 'F';
    return this.firm.firm_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFirm(id);
    }
  }

  loadFirm(id: string): void {
    this.loading = true;
    this.firmService.getFirmById(id).subscribe({
      next: (response) => {
        this.firm = response.data.firm;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load firm details');
        this.goBack();
      }
    });
  }

  goBack(): void {
    const rolePrefix = this.router.url.split('/')[1] || 'admin';
    this.router.navigate([`/${rolePrefix}/firms`]);
  }
}
