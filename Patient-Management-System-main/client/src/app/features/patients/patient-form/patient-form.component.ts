import { CommonModule, Location } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import {
  CreatePatientPayload,
  Gender,
  Patient,
  PatientStatus,
  UpdatePatientPayload,
} from '../../../core/models/patient.model';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
})
export class PatientFormComponent implements OnInit {
  //INFO: Input for the patient to edit. If null, component is in 'Create' mode.
  @Input() patientToEdit: Patient | null = null;

  //INFO: EventEmitter to notify parent when operation is successful
  @Output() formSuccess = new EventEmitter<Patient>();

  //INFO: EventEmitter to handle cancellations (especially in modals)
  @Output() formCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private location = inject(Location);
  private toastService = inject(ToastService);

  readonly phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{1,4}[-.\s]?\d{3}[-.\s]?\d{4}$/;

  readonly genderOptions: Array<{ label: string; value: Gender }> = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer Not To Say', value: 'prefer_not_to_say' },
  ];

  readonly patientStatusOptions: Array<{
    label: string;
    value: PatientStatus;
  }> = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Deceased', value: 'deceased' },
    { label: 'Transferred', value: 'transferred' },
  ];

  readonly countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'India',
    'Pakistan',
    'Other',
  ];

  readonly states = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
    'Other',
  ];

  currentStep = 1;
  isSubmitting = false;

  private readonly fieldLabels: Record<string, string> = {
    first_name: 'First name',
    middle_name: 'Middle name',
    last_name: 'Last name',
    date_of_birth: 'Date of birth',
    gender: 'Gender',
    cnic: 'CNIC',
    email: 'Email',
    phone: 'Phone',
    mobile: 'Mobile',
    address: 'Address',
    city: 'City',
    state: 'State',
    zip_code: 'ZIP code',
    country: 'Country',
    emergency_contact_name: 'Emergency contact name',
    emergency_contact_phone: 'Emergency contact phone',
    primary_physician: 'Primary physician',
    insurance_provider: 'Insurance provider',
    insurance_policy_number: 'Insurance policy number',
    preferred_language: 'Preferred language',
    patient_status: 'Patient status',
  };

  //INFO: Form definition with validation rules matching backend schemas
  form = this.fb.group({
    first_name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    middle_name: ['', [Validators.maxLength(50)]],
    last_name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    date_of_birth: ['', [Validators.required]],
    gender: ['male' as Gender, [Validators.required]],
    cnic: ['', [Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],

    email: ['', [Validators.email]],
    phone: ['', [Validators.pattern(this.phoneRegex)]],
    mobile: ['', [Validators.pattern(this.phoneRegex)]],
    address: ['', [Validators.maxLength(100)]],
    city: ['', [Validators.maxLength(50)]],
    state: ['', [Validators.maxLength(50)]],
    zip_code: ['', [Validators.pattern(/^\d{5}(-\d{4})?$/)]],
    country: ['', [Validators.maxLength(50)]],
    emergency_contact_name: ['', [Validators.maxLength(50)]],
    emergency_contact_phone: ['', [Validators.pattern(this.phoneRegex)]],

    primary_physician: ['', [Validators.maxLength(50)]],
    insurance_provider: ['', [Validators.maxLength(50)]],
    insurance_policy_number: ['', [Validators.maxLength(50)]],
    preferred_language: ['English', [Validators.maxLength(30)]],
    patient_status: ['active' as PatientStatus, [Validators.required]],
  });

  ngOnInit(): void {
    //INFO: If in edit mode, patch the form with the patient's existing data
    if (this.patientToEdit) {
      const dob = this.patientToEdit.date_of_birth
        ? new Date(this.patientToEdit.date_of_birth).toISOString().split('T')[0]
        : '';

      this.form.patchValue({
        ...this.patientToEdit,
        date_of_birth: dob,
      } as any);
    }
  }

  get isEditMode(): boolean {
    return !!this.patientToEdit;
  }

  get maskedCnic(): string {
    const raw = this.form.value.cnic || '';
    if (!raw || raw.length < 4) {
      return '•••••-•••••••-•';
    }
    return `•••••-•••••••-${raw.slice(-1)}`;
  }

  private controlsForStep(step: number): string[] {
    if (step === 1) {
      return ['first_name', 'last_name', 'date_of_birth', 'gender', 'cnic'];
    }
    if (step === 2) {
      return [
        'email',
        'phone',
        'mobile',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'emergency_contact_name',
        'emergency_contact_phone',
      ];
    }
    return ['patient_status'];
  }

  private isStepValid(step: number): boolean {
    return this.controlsForStep(step).every(
      (name) => !this.form.get(name)?.invalid,
    );
  }

  private touchStep(step: number): void {
    this.controlsForStep(step).forEach((name) => {
      this.form.get(name)?.markAsTouched();
      this.form.get(name)?.updateValueAndValidity();
    });
  }

  goToPreviousStep(): void {
    this.currentStep = Math.max(1, this.currentStep - 1);
  }

  goToNextStep(): void {
    this.touchStep(this.currentStep);
    if (!this.isStepValid(this.currentStep)) {
      return;
    }
    this.currentStep = Math.min(3, this.currentStep + 1);
  }

  selectGender(value: Gender): void {
    this.form.patchValue({ gender: value });
  }

  selectStatus(value: PatientStatus): void {
    this.form.patchValue({ patient_status: value });
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

    if (errors['pattern']) {
      if (controlName === 'cnic') {
        return 'Please enter CNIC in 12345-1234567-1 format.';
      }
      if (controlName === 'zip_code') {
        return 'Please enter a valid ZIP code (12345 or 12345-6789).';
      }
      if (
        controlName === 'phone' ||
        controlName === 'mobile' ||
        controlName === 'emergency_contact_phone'
      ) {
        return `Please enter a valid ${label.toLowerCase()}.`;
      }
      return `${label} format is invalid.`;
    }

    return `${label} is invalid.`;
  }

  private firstInvalidStep(): number {
    if (!this.isStepValid(1)) {
      return 1;
    }
    if (!this.isStepValid(2)) {
      return 2;
    }
    return 3;
  }

  onCancel(): void {
    if (this.formCancel.observed) {
      this.formCancel.emit();
    } else {
      //INFO: Navigate back to the previous screen (respects role-based routes)
      this.location.back();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.currentStep = this.firstInvalidStep();
      return;
    }

    const value = this.form.getRawValue();

    //INFO: Construct payload, ensuring strings are trimmed and optional fields are properly handled
    const payload: CreatePatientPayload = {
      first_name: value.first_name?.trim() || '',
      middle_name: value.middle_name?.trim() || undefined,
      last_name: value.last_name?.trim() || '',
      date_of_birth: value.date_of_birth || '',
      gender: (value.gender || 'male') as Gender,
      cnic: value.cnic?.trim() || undefined,
      email: value.email?.trim() || undefined,
      phone: value.phone?.trim() || undefined,
      mobile: value.mobile?.trim() || undefined,
      address: value.address?.trim() || undefined,
      city: value.city?.trim() || undefined,
      state: value.state?.trim() || undefined,
      zip_code: value.zip_code?.trim() || undefined,
      country: value.country?.trim() || undefined,
      emergency_contact_name: value.emergency_contact_name?.trim() || undefined,
      emergency_contact_phone:
        value.emergency_contact_phone?.trim() || undefined,
      primary_physician: value.primary_physician?.trim() || undefined,
      insurance_provider: value.insurance_provider?.trim() || undefined,
      insurance_policy_number:
        value.insurance_policy_number?.trim() || undefined,
      preferred_language: value.preferred_language?.trim() || 'English',
      patient_status: (value.patient_status || 'active') as PatientStatus,
      registration_date:
        this.patientToEdit?.registration_date || new Date().toISOString(),
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.patientToEdit) {
      //INFO: Handle update operation
      this.patientService
        .updatePatient(this.patientToEdit.id, payload as UpdatePatientPayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.toastService.success('Patient record updated successfully');
            this.formSuccess.emit(response.data.patient);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });
    } else {
      //INFO: Handle create operation
      this.patientService.createPatient(payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;

          this.formSuccess.emit(response.data.patient);
          if (!this.formSuccess.observed) {
            this.location.back();
          }
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
    }
  }
}
