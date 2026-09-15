import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { VisitService } from '../../../core/services/visit.service';
import {
  UpdateVisitPayload,
  Visit,
  VisitStatus,
} from '../../../core/models/visit.model';
import { AuthService } from '../../../core/services/auth.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { DiagnosisService } from '../../../core/services/diagnosis.service';
import { Diagnosis } from '../../../core/models/diagnosis.model';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface DiagnosisOption extends Diagnosis {
  display_label: string;
}

type DiagnosisMode = 'existing' | 'new';

@Component({
  selector: 'app-visit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './visit-form.component.html',
})
export class VisitFormComponent implements OnInit, OnChanges {
  @Input() visitToEdit: Visit | null = null;
  @Output() formSuccess = new EventEmitter<Visit>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly visitService = inject(VisitService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly diagnosisService = inject(DiagnosisService);
  private readonly searchableSelectPageSize =
    environment.searchableSelectPageSize;

  isSubmitting = false;
  diagnoses$ = new Subject<DiagnosisOption[]>();
  diagnosesLoading = false;
  private diagnosisOptions: DiagnosisOption[] = [];

  readonly statusOptions: VisitStatus[] = [
    'Draft',
    'Completed',
    'Cancelled',
    'Billed',
  ];

  private readonly fieldLabels: Record<string, string> = {
    visit_status: 'Visit status',
    visit_date: 'Visit date',
    visit_time: 'Visit time',
    diagnoses_id: 'Diagnosis',
    diagnosis_icd_code: 'Diagnosis code',
    diagnosis_description: 'Diagnosis description',
  };

  form = this.fb.group({
    visit_status: ['Draft' as VisitStatus, [Validators.required]],
    visit_date: [''],
    visit_time: [''],
    visit_duration_minutes: [null as number | null],
    diagnosis_mode: ['existing' as DiagnosisMode],
    diagnoses_id: [''],
    diagnosis_icd_code: [''],
    diagnosis_description: [''],
    diagnosis_is_active: [true],
    symptoms: [''],
    treatment: [''],
    treatment_plan: [''],
    prescription: [''],
    prescription_documents_text: [''],
    notes: [''],
    vital_weight: [''],
    vital_heart_rate: [''],
    vital_temperature: [''],
    vital_blood_pressure: [''],
    vital_respiratory_rate: [''],
    vital_oxygen_saturation: [''],
    follow_up_required: [false],
    follow_up_date: [''],
    referral_made: [false],
    referral_to: [''],
  });

  ngOnInit(): void {
    this.setupDiagnosisModeHandling();
    this.loadDiagnoses('');
    this.patchFormFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visitToEdit']) {
      this.patchFormFromInput();
    }
  }

  get isDoctorRole(): boolean {
    return this.authService.isDoctor();
  }

  private patchFormFromInput(): void {
    if (!this.visitToEdit) {
      return;
    }

    this.form.patchValue({
      visit_status: this.visitToEdit.visit_status,
      visit_date: this.visitToEdit.visit_date || '',
      visit_time: this.visitToEdit.visit_time || '',
      visit_duration_minutes: this.visitToEdit.visit_duration_minutes ?? null,
      diagnosis_mode: 'existing',
      diagnoses_id: this.visitToEdit.diagnoses_id || '',
      diagnosis_icd_code: '',
      diagnosis_description: '',
      diagnosis_is_active: true,
      symptoms: this.visitToEdit.symptoms || '',
      treatment: this.visitToEdit.treatment || '',
      treatment_plan: this.visitToEdit.treatment_plan || '',
      prescription: this.visitToEdit.prescription || '',
      prescription_documents_text: this.stringifyPrescriptionDocuments(
        this.visitToEdit.prescription_documents as unknown[] | null,
      ),
      notes: this.visitToEdit.notes || '',
      vital_weight: this.getVitalSignValue(this.visitToEdit.vital_signs, [
        'weight',
      ]),
      vital_heart_rate: this.getVitalSignValue(this.visitToEdit.vital_signs, [
        'heart_rate',
        'pulse',
      ]),
      vital_temperature: this.getVitalSignValue(this.visitToEdit.vital_signs, [
        'temperature',
      ]),
      vital_blood_pressure: this.getVitalSignValue(
        this.visitToEdit.vital_signs,
        ['blood_pressure', 'bp'],
      ),
      vital_respiratory_rate: this.getVitalSignValue(
        this.visitToEdit.vital_signs,
        ['respiratory_rate'],
      ),
      vital_oxygen_saturation: this.getVitalSignValue(
        this.visitToEdit.vital_signs,
        ['oxygen_saturation', 'spo2'],
      ),
      follow_up_required: !!this.visitToEdit.follow_up_required,
      follow_up_date: this.visitToEdit.follow_up_date || '',
      referral_made: !!this.visitToEdit.referral_made,
      referral_to: this.visitToEdit.referral_to || '',
    });

    this.ensureSelectedDiagnosisOption();
    this.applyDiagnosisModeValidators(
      (this.form.get('diagnosis_mode')?.value as DiagnosisMode) || 'existing',
    );
  }

  onDiagnosisSearch(term: string): void {
    this.loadDiagnoses(term);
  }

  private setupDiagnosisModeHandling(): void {
    this.form.get('diagnosis_mode')?.valueChanges.subscribe((mode) => {
      this.applyDiagnosisModeValidators((mode as DiagnosisMode) || 'existing');
    });
  }

  private applyDiagnosisModeValidators(mode: DiagnosisMode): void {
    const diagnosesIdControl = this.form.get('diagnoses_id');
    const diagnosisIcdCodeControl = this.form.get('diagnosis_icd_code');
    const diagnosisDescriptionControl = this.form.get('diagnosis_description');

    if (mode === 'new') {
      diagnosesIdControl?.setValue('', { emitEvent: false });
      diagnosesIdControl?.clearValidators();

      diagnosisIcdCodeControl?.setValidators([Validators.required]);
      diagnosisDescriptionControl?.setValidators([Validators.required]);
    } else {
      diagnosisIcdCodeControl?.setValue('', { emitEvent: false });
      diagnosisDescriptionControl?.setValue('', { emitEvent: false });

      diagnosisIcdCodeControl?.clearValidators();
      diagnosisDescriptionControl?.clearValidators();
    }

    diagnosesIdControl?.updateValueAndValidity({ emitEvent: false });
    diagnosisIcdCodeControl?.updateValueAndValidity({ emitEvent: false });
    diagnosisDescriptionControl?.updateValueAndValidity({ emitEvent: false });
  }

  private formatDiagnosisLabel(
    icdCode?: string | null,
    description?: string | null,
  ): string {
    const safeCode = (icdCode || 'Unknown code').trim();
    const safeDescription = (description || 'No description').trim();
    return `${safeCode} - ${safeDescription}`;
  }

  private mapDiagnosisOptions(diagnoses: Diagnosis[]): DiagnosisOption[] {
    return diagnoses.map((diagnosis) => ({
      ...diagnosis,
      display_label: this.formatDiagnosisLabel(
        diagnosis.icd_code,
        diagnosis.description || diagnosis.diagnoses_name,
      ),
    }));
  }

  private ensureSelectedDiagnosisOption(): void {
    if (!this.visitToEdit?.diagnoses_id) {
      return;
    }

    const selectedId = this.visitToEdit.diagnoses_id;
    const exists = this.diagnosisOptions.some(
      (option) => option.id === selectedId,
    );

    if (exists) {
      this.diagnoses$.next(this.diagnosisOptions);
      return;
    }

    const selectedOption: DiagnosisOption = {
      id: selectedId,
      icd_code: this.visitToEdit.diagnoses_icd_code || 'Unknown code',
      diagnoses_name:
        this.visitToEdit.diagnoses_name ||
        this.visitToEdit.diagnoses_description ||
        'Diagnosis',
      description:
        this.visitToEdit.diagnoses_description ||
        this.visitToEdit.diagnoses_name ||
        'No description',
      is_active: this.visitToEdit.diagnoses_is_active ?? true,
      display_label: this.formatDiagnosisLabel(
        this.visitToEdit.diagnoses_icd_code,
        this.visitToEdit.diagnoses_description ||
          this.visitToEdit.diagnoses_name,
      ),
    };

    this.diagnosisOptions = [selectedOption, ...this.diagnosisOptions];
    this.diagnoses$.next(this.diagnosisOptions);
  }

  private loadDiagnoses(term: string): void {
    this.diagnosesLoading = true;

    this.diagnosisService
      .getDiagnoses({
        search: term,
        is_active: true,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe({
        next: (response) => {
          this.diagnosisOptions = this.mapDiagnosisOptions(response.data);
          this.ensureSelectedDiagnosisOption();
          this.diagnosesLoading = false;
        },
        error: () => {
          this.diagnosesLoading = false;
        },
      });
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private stringifyPrescriptionDocuments(value?: unknown[] | null): string {
    if (!value?.length) {
      return '';
    }

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const preferredValue = [
            record['url'],
            record['path'],
            record['file_name'],
            record['name'],
          ].find((candidate) => {
            return typeof candidate === 'string' && candidate.trim().length > 0;
          });

          if (typeof preferredValue === 'string') {
            return preferredValue;
          }

          return JSON.stringify(item);
        }

        return String(item ?? '');
      })
      .join('\n');
  }

  private getVitalSignValue(
    vitalSigns: Record<string, unknown> | null | undefined,
    keys: string[],
  ): string {
    if (!vitalSigns || typeof vitalSigns !== 'object') {
      return '';
    }

    for (const key of keys) {
      const value = vitalSigns[key];
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        return String(value);
      }
    }

    return '';
  }

  private buildVitalSignsPayload(raw: {
    vital_weight?: string | null;
    vital_heart_rate?: string | null;
    vital_temperature?: string | null;
    vital_blood_pressure?: string | null;
    vital_respiratory_rate?: string | null;
    vital_oxygen_saturation?: string | null;
  }): Record<string, unknown> | undefined {
    const vitalSigns: Record<string, unknown> = {};

    const assignIfPresent = (targetKey: string, value?: string | null) => {
      const normalized = (value ?? '').trim();
      if (normalized) {
        vitalSigns[targetKey] = normalized;
      }
    };

    assignIfPresent('weight', raw.vital_weight);
    assignIfPresent('heart_rate', raw.vital_heart_rate);
    assignIfPresent('temperature', raw.vital_temperature);
    assignIfPresent('blood_pressure', raw.vital_blood_pressure);
    assignIfPresent('respiratory_rate', raw.vital_respiratory_rate);
    assignIfPresent('oxygen_saturation', raw.vital_oxygen_saturation);

    return Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined;
  }

  private parsePrescriptionDocuments(
    raw: string | null | undefined,
  ): string[] | undefined {
    const value = (raw ?? '').trim();

    if (!value) {
      return undefined;
    }

    const items = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return items.length > 0 ? items : undefined;
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

    if (errors['min']) {
      return `${label} must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      return `${label} cannot exceed ${errors['max'].max}.`;
    }

    return `${label} is invalid.`;
  }

  onSubmit(): void {
    if (!this.visitToEdit) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    if (this.isDoctorRole) {
      const payload: UpdateVisitPayload = {
        diagnoses_id: value.diagnoses_id || null,
        treatment: value.treatment?.trim() || undefined,
        prescription: value.prescription?.trim() || undefined,
        notes: value.notes?.trim() || undefined,
      };

      this.isSubmitting = true;

      this.visitService.updateVisit(this.visitToEdit.id, payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Visit updated successfully');
          this.formSuccess.emit(response.data.visit);
        },
        error: () => {
          this.isSubmitting = false;
        },
      });

      return;
    }

    const payload: UpdateVisitPayload = {
      visit_status: (value.visit_status || 'Draft') as VisitStatus,
      visit_date: value.visit_date || undefined,
      visit_time: value.visit_time || undefined,
      visit_duration_minutes: value.visit_duration_minutes || undefined,
      diagnoses_id:
        value.diagnosis_mode === 'existing' ? value.diagnoses_id || null : null,
      diagnosis_icd_code:
        value.diagnosis_mode === 'new'
          ? value.diagnosis_icd_code?.trim() || undefined
          : undefined,
      diagnosis_description:
        value.diagnosis_mode === 'new'
          ? value.diagnosis_description?.trim() || undefined
          : undefined,
      diagnosis_is_active:
        value.diagnosis_mode === 'new'
          ? !!value.diagnosis_is_active
          : undefined,
      symptoms: value.symptoms?.trim() || undefined,
      treatment: value.treatment?.trim() || undefined,
      treatment_plan: value.treatment_plan?.trim() || undefined,
      prescription: value.prescription?.trim() || undefined,
      prescription_documents: this.parsePrescriptionDocuments(
        value.prescription_documents_text,
      ),
      notes: value.notes?.trim() || undefined,
      vital_signs: this.buildVitalSignsPayload(value),
      follow_up_required: !!value.follow_up_required,
      follow_up_date: value.follow_up_date || null,
      referral_made: !!value.referral_made,
      referral_to: value.referral_to?.trim() || null,
    };

    this.isSubmitting = true;

    this.visitService.updateVisit(this.visitToEdit.id, payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success('Visit updated successfully');
        this.formSuccess.emit(response.data.visit);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
