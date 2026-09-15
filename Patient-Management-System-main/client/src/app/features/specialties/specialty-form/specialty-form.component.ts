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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import {
  CreateSpecialtyPayload,
  Specialty,
  UpdateSpecialtyPayload,
} from '../../../core/models/specialty.model';
import { SpecialtyService } from '../../../core/services/specialty.service';

@Component({
  selector: 'app-specialty-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './specialty-form.component.html',
})
export class SpecialtyFormComponent implements OnChanges {
  @Input() specialtyToEdit: Specialty | null = null;

  @Output() formSuccess = new EventEmitter<Specialty>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);

  isSubmitting = false;

  private readonly fieldLabels: Record<string, string> = {
    specialty_name: 'Specialty name',
    description: 'Description',
  };

  form = this.fb.group({
    specialty_name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    description: ['', [Validators.maxLength(500)]],
    is_active: [true, [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['specialtyToEdit']) {
      return;
    }

    if (!this.specialtyToEdit) {
      this.form.reset({
        specialty_name: '',
        description: '',
        is_active: true,
      });
      return;
    }

    this.form.patchValue({
      specialty_name: this.specialtyToEdit.specialty_name || '',
      description: this.specialtyToEdit.description || '',
      is_active: this.specialtyToEdit.is_active ?? true,
    });
  }

  get isEditMode(): boolean {
    return !!this.specialtyToEdit;
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

    const payload: CreateSpecialtyPayload = {
      specialty_name: value.specialty_name?.trim() || '',
      ...(value.description?.trim()
        ? { description: value.description.trim() }
        : {}),
      is_active: !!value.is_active,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.specialtyToEdit) {
      const updatePayload: UpdateSpecialtyPayload = {
        ...payload,
      };

      this.specialtyService
        .updateSpecialty(this.specialtyToEdit.id, updatePayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.toastService.success('Specialty updated successfully');
            this.formSuccess.emit(response.data.specialty);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });

      return;
    }

    this.specialtyService.createSpecialty(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success('Specialty created successfully');
        this.formSuccess.emit(response.data.specialty);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
