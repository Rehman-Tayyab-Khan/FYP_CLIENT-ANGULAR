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
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import {
  CreateInsurancePayload,
  InsuranceAddressPayload,
  Insurance,
  UpdateInsurancePayload,
} from '../../../core/models/insurance.model';
import { InsuranceService } from '../../../core/services/insurance.service';

@Component({
  selector: 'app-insurance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insurance-form.component.html',
})
export class InsuranceFormComponent implements OnChanges {
  @Input() insuranceToEdit: Insurance | null = null;

  @Output() formSuccess = new EventEmitter<Insurance>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly insuranceService = inject(InsuranceService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);

  isSubmitting = false;

  private readonly fieldLabels: Record<string, string> = {
    insurance_name: 'Insurance name',
    insurance_code: 'Insurance code',
  };

  form = this.fb.group({
    insurance_name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    insurance_code: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    addresses: this.fb.array<FormGroup>([
      this.createAddressGroup({ is_primary: true }),
    ]),
    is_active: [true, [Validators.required]],
  });

  private createAddressGroup(
    value?: Partial<InsuranceAddressPayload>,
  ): FormGroup {
    return this.fb.group({
      id: [value?.id ?? null],
      address: [
        value?.address ?? '',
        [Validators.required, Validators.maxLength(500)],
      ],
      phone: [
        value?.phone ?? '',
        [
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11),
        ],
      ],
      is_primary: [!!value?.is_primary, [Validators.required]],
    });
  }

  private get addressesArray(): FormArray<FormGroup> {
    return this.form.get('addresses') as FormArray<FormGroup>;
  }

  get addressesControls(): FormGroup[] {
    return this.addressesArray.controls;
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      return value === '1' || value.toLowerCase() === 'true';
    }

    return false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['insuranceToEdit']) {
      return;
    }

    if (!this.insuranceToEdit) {
      this.replaceAddresses([{ is_primary: true }]);
      this.form.reset({
        insurance_name: '',
        insurance_code: '',
        is_active: true,
      });
      return;
    }

    const incomingAddresses =
      this.insuranceToEdit.addresses &&
      this.insuranceToEdit.addresses.length > 0
        ? this.insuranceToEdit.addresses.map((address) => ({
            ...address,
            phone: address.phone ?? '',
          }))
        : this.insuranceToEdit.primary_address
          ? [
              {
                ...this.insuranceToEdit.primary_address,
                phone: this.insuranceToEdit.primary_address.phone ?? '',
              },
            ]
          : [{ is_primary: true }];

    this.replaceAddresses(incomingAddresses);

    this.form.patchValue({
      insurance_name: this.insuranceToEdit.insurance_name || '',
      insurance_code: this.insuranceToEdit.insurance_code || '',
      is_active: this.normalizeBoolean(this.insuranceToEdit.is_active),
    });

    this.ensureSinglePrimary();
  }

  private replaceAddresses(
    addresses: Array<Partial<InsuranceAddressPayload>>,
  ): void {
    this.addressesArray.clear();

    addresses.forEach((address) => {
      this.addressesArray.push(this.createAddressGroup(address));
    });

    if (this.addressesArray.length === 0) {
      this.addressesArray.push(this.createAddressGroup({ is_primary: true }));
    }
  }

  get isEditMode(): boolean {
    return !!this.insuranceToEdit;
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isAddressFieldInvalid(
    index: number,
    controlName: 'address' | 'phone',
  ): boolean {
    const control = this.addressesArray.at(index)?.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getAddressFieldErrorMessage(
    index: number,
    controlName: 'address' | 'phone',
  ): string {
    const control = this.addressesArray.at(index)?.get(controlName);

    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    if (control.errors['required']) {
      return controlName === 'address'
        ? 'Address is required.'
        : 'Phone is required.';
    }

    if (control.errors['minlength'] || control.errors['maxlength']) {
      if (controlName === 'phone') {
        return 'Phone must be exactly 11 characters.';
      }
    }

    if (control.errors['maxlength']) {
      return `${controlName === 'address' ? 'Address' : 'Phone'} cannot exceed ${control.errors['maxlength'].requiredLength} characters.`;
    }

    return `${controlName === 'address' ? 'Address' : 'Phone'} is invalid.`;
  }

  addAddress(): void {
    this.addressesArray.push(this.createAddressGroup({ is_primary: false }));
  }

  removeAddress(index: number): void {
    if (this.addressesArray.length <= 1) {
      return;
    }

    const wasPrimary = this.normalizeBoolean(
      this.addressesArray.at(index).get('is_primary')?.value,
    );

    this.addressesArray.removeAt(index);

    if (this.addressesArray.length === 0) {
      this.addressesArray.push(this.createAddressGroup({ is_primary: true }));
      return;
    }

    if (wasPrimary) {
      const fallbackIndex = Math.max(0, index - 1);
      this.setPrimaryAddress(fallbackIndex);
      return;
    }

    this.ensureSinglePrimary();
  }

  setPrimaryAddress(index: number): void {
    this.addressesControls.forEach((group, i) => {
      group.get('is_primary')?.setValue(i === index);
    });
  }

  canRemoveAddress(): boolean {
    return this.addressesArray.length > 1;
  }

  private ensureSinglePrimary(): void {
    if (this.addressesArray.length === 0) {
      return;
    }

    let primaryIndex = -1;

    this.addressesControls.forEach((group, index) => {
      if (
        this.normalizeBoolean(group.get('is_primary')?.value) &&
        primaryIndex === -1
      ) {
        primaryIndex = index;
      } else if (this.normalizeBoolean(group.get('is_primary')?.value)) {
        group.get('is_primary')?.setValue(false);
      }
    });

    if (primaryIndex === -1) {
      this.addressesControls[0].get('is_primary')?.setValue(true);
    }
  }

  private hasExactlyOnePrimary(): boolean {
    const primaryCount = this.addressesControls.filter((group) =>
      this.normalizeBoolean(group.get('is_primary')?.value),
    ).length;

    return primaryCount === 1;
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
    this.ensureSinglePrimary();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.addressesControls.forEach((group) => group.markAllAsTouched());
      return;
    }

    if (!this.hasExactlyOnePrimary()) {
      this.toastService.error('Please select exactly one primary address.');
      return;
    }

    const value = this.form.getRawValue();

    const addresses: InsuranceAddressPayload[] = (value.addresses || []).map(
      (address: any) => ({
        ...(address.id ? { id: address.id } : {}),
        address: (address.address || '').trim(),
        phone: (address.phone || '').trim(),
        is_primary: this.normalizeBoolean(address.is_primary),
      }),
    );

    const primaryAddress =
      addresses.find((address) => address.is_primary) || addresses[0];

    const payload: CreateInsurancePayload = {
      insurance_name: value.insurance_name?.trim() || '',
      insurance_code: value.insurance_code?.trim() || '',
      addresses,
      // Keep these for backward compatibility with single-address handlers.
      address: primaryAddress?.address || '',
      phone: primaryAddress?.phone || '',
      is_active: !!value.is_active,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.insuranceToEdit) {
      const updatePayload: UpdateInsurancePayload = {
        ...payload,
      };

      this.insuranceService
        .updateInsurance(this.insuranceToEdit.id, updatePayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.toastService.success('Insurance updated successfully');
            this.formSuccess.emit(response.data.insurance);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });

      return;
    }

    this.insuranceService.createInsurance(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success('Insurance created successfully');
        this.formSuccess.emit(response.data.insurance);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
