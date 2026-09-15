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
import {
  CreatePracticeLocationPayload,
  PracticeLocation,
  UpdatePracticeLocationPayload,
} from '../../../core/models/practice-location.model';
import { PracticeLocationService } from '../../../core/services/practice-location.service';

@Component({
  selector: 'app-practice-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './practice-location-form.component.html',
})
export class PracticeLocationFormComponent implements OnChanges {
  @Input() practiceLocationToEdit: PracticeLocation | null = null;

  @Output() formSuccess = new EventEmitter<PracticeLocation>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly location = inject(Location);

  isSubmitting = false;

  private readonly fieldLabels: Record<string, string> = {
    location_name: 'Location name',
    address: 'Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP',
    phone: 'Phone',
    email: 'Email',
  };

  form = this.fb.group({
    location_name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(255)],
    ],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    zip: ['', [Validators.required, Validators.maxLength(20)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    is_active: [true, [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['practiceLocationToEdit']) {
      return;
    }

    if (!this.practiceLocationToEdit) {
      this.form.reset({
        location_name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        is_active: true,
      });
      return;
    }

    this.form.patchValue({
      location_name: this.practiceLocationToEdit.location_name || '',
      address: this.practiceLocationToEdit.address || '',
      city: this.practiceLocationToEdit.city || '',
      state: this.practiceLocationToEdit.state || '',
      zip: this.practiceLocationToEdit.zip || '',
      phone: this.practiceLocationToEdit.phone || '',
      email: this.practiceLocationToEdit.email || '',
      is_active: this.practiceLocationToEdit.is_active,
    });
  }

  get isEditMode(): boolean {
    return !!this.practiceLocationToEdit;
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

    if (errors['email']) {
      return 'Please enter a valid email address.';
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

    const payload: CreatePracticeLocationPayload = {
      location_name: value.location_name?.trim() || '',
      address: value.address?.trim() || '',
      city: value.city?.trim() || '',
      state: value.state?.trim() || '',
      zip: value.zip?.trim() || '',
      phone: value.phone?.trim() || '',
      email: value.email?.trim() || '',
      is_active: !!value.is_active,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.practiceLocationToEdit) {
      const updatePayload: UpdatePracticeLocationPayload = { ...payload };

      this.practiceLocationService
        .updatePracticeLocation(this.practiceLocationToEdit.id, updatePayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.formSuccess.emit(response.data.practice_location);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });

      return;
    }

    this.practiceLocationService.createPracticeLocation(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.formSuccess.emit(response.data.practice_location);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
