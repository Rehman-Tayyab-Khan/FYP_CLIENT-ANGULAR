import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  styles: [
    `
      .app-toast-item.alert-success {
        background-color: #16a34a;
        border-color: #15803d;
        color: #ffffff;
      }

      .app-toast-item.alert-error {
        background-color: #dc2626;
        border-color: #b91c1c;
        color: #ffffff;
      }
    `,
  ],
  template: `
    <div class="toast toast-top toast-end z-50">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="app-toast-item alert alert-{{
            toast.type
          }} flex justify-between gap-4 min-w-64"
        >
          <span>{{ toast.message }}</span>
          <button
            class="btn btn-ghost btn-xs"
            (click)="toastService.remove(toast.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);
}
