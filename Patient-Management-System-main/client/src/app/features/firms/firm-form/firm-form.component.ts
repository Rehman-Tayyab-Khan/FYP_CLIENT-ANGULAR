import { CommonModule, Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import {
  CreateFirmPayload,
  Firm,
  FirmType,
  UpdateFirmPayload,
} from '../../../core/models/firm.model';
import { FirmService } from '../../../core/services/firm.service';

@Component({
  selector: 'app-firm-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './firm-form.component.html',
})
export class FirmFormComponent implements OnChanges {
  @Input() firmToEdit: Firm | null = null;

  @Output() formSuccess = new EventEmitter<Firm>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly firmService = inject(FirmService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);

  isSubmitting = false;
  firmTypes = Object.values(FirmType);

  private readonly fieldLabels: Record<string, string> = {
    firm_name: 'Firm Name',
    firm_type: 'Firm Type',
    address: 'Address',
    phone: 'Phone',
    contact_person: 'Contact Person',
    email: 'Email',
    is_active: 'Status',
  };

  form = this.fb.group({
    firm_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    firm_type: [FirmType.LEGAL, [Validators.required]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    phone: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    contact_person: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    is_active: [true, [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['firmToEdit'] && this.firmToEdit) {
      this.form.patchValue({
        firm_name: this.firmToEdit.firm_name,
        firm_type: this.firmToEdit.firm_type,
        address: this.firmToEdit.address,
        phone: this.firmToEdit.phone,
        contact_person: this.firmToEdit.contact_person,
        email: this.firmToEdit.email,
        is_active: !!this.firmToEdit.is_active,
      });
    }
  }

  get isEditMode(): boolean {
    return !!this.firmToEdit;
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    const label = this.fieldLabels[controlName] || 'This field';
    const errors = control.errors;

    if (errors['required']) {
      return `${label} is required.`;
    }
    if (errors['minlength']) {
      return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
    }
    if (errors['maxlength']) {
      return `${label} cannot exceed ${errors['maxlength'].requiredLength} characters.`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address.';
    }

    return `${label} is invalid.`;
  }

  onCancel(): void {
    if (this.formCancel.observed) {
      this.formCancel.emit();
      return;
    }
    this.location.back();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateFirmPayload = {
      firm_name: value.firm_name!.trim(),
      firm_type: value.firm_type as FirmType,
      address: value.address!.trim(),
      phone: value.phone!.trim(),
      contact_person: value.contact_person!.trim(),
      email: value.email?.trim() || undefined,
      is_active: !!value.is_active,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.firmToEdit) {
      this.firmService.updateFirm(this.firmToEdit.id, payload as UpdateFirmPayload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Firm updated successfully');
          this.formSuccess.emit(response.data.firm);
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.firmService.createFirm(payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Firm created successfully');
          this.formSuccess.emit(response.data.firm);
        },
        error: () => (this.isSubmitting = false),
      });
    }
  }
}
