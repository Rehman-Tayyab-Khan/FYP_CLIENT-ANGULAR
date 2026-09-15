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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { PatientService } from '../../../core/services/patient.service';
import { PracticeLocationService } from '../../../core/services/practice-location.service';
import { InsuranceService } from '../../../core/services/insurance.service';
import { FirmService } from '../../../core/services/firm.service';
import { CaseService } from '../../../core/services/case.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Case,
  CaseCategory,
  CasePriority,
  CaseStatus,
  CaseType,
} from '../../../core/models/case.model';
import { Patient } from '../../../core/models/patient.model';
import { PracticeLocation } from '../../../core/models/practice-location.model';
import { Insurance } from '../../../core/models/insurance.model';
import { Firm } from '../../../core/models/firm.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './case-form.component.html',
})
export class CaseFormComponent implements OnInit, OnChanges {
  @Input() caseMode: 'create' | 'edit' = 'create';
  @Input() initialData: Case | null = null;
  @Output() formSuccess = new EventEmitter<Case>();
  @Output() formCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private practiceLocationService = inject(PracticeLocationService);
  private insuranceService = inject(InsuranceService);
  private firmService = inject(FirmService);
  private caseService = inject(CaseService);
  private toastService = inject(ToastService);

  caseForm!: FormGroup;
  isSubmitting = false;

  // Enums for Selects
  caseCategories = Object.values(CaseCategory);
  caseTypes = Object.values(CaseType);
  casePriorities = Object.values(CasePriority);

  // ng-select Data Sources
  patients$ = new Subject<Patient[]>();
  patientsLoading = false;
  patientSearchInput$ = new Subject<string>();

  practiceLocations$ = new Subject<PracticeLocation[]>();
  locationsLoading = false;
  locationSearchInput$ = new Subject<string>();

  insurances$ = new Subject<Insurance[]>();
  insurancesLoading = false;
  insuranceSearchInput$ = new Subject<string>();

  firms$ = new Subject<Firm[]>();
  firmsLoading = false;
  firmSearchInput$ = new Subject<string>();
  private readonly searchableSelectPageSize =
    environment.searchableSelectPageSize;

  private readonly fieldLabels: Record<string, string> = {
    patient_id: 'Patient',
    practice_location_id: 'Practice location',
    category: 'Case category',
    case_type: 'Case type',
    priority: 'Priority',
    purpose_of_visit: 'Purpose of visit',
  };

  ngOnInit() {
    this.initForm();
    this.setupPatientSearch();
    this.setupLocationSearch();
    this.setupInsuranceSearch();
    this.setupFirmSearch();

    if (this.initialData) {
      this.patchFormValues();
    }

    // Load initial empty searches to populate default list
    this.loadPatients('');
    this.loadLocations('');
    this.loadInsurances('');
    this.loadFirms('');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && this.initialData && this.caseForm) {
      this.patchFormValues();
    }
  }

  private initForm() {
    this.caseForm = this.fb.group({
      patient_id: [null, Validators.required],
      practice_location_id: [null, Validators.required],
      category: [null, Validators.required],
      case_type: [null, Validators.required],
      priority: [CasePriority.NORMAL, Validators.required],
      purpose_of_visit: ['', Validators.required],
      date_of_accident: [null],
      insurance_id: [null],
      firm_id: [null],
      referred_by: [''],
      referred_doctor_name: [''],
      opening_date: [new Date().toISOString().split('T')[0]],
      closing_date: [null],
      clinical_notes: [''],
    });
  }

  private patchFormValues() {
    if (this.caseForm && this.initialData) {
      this.seedSelectOptionsFromInitialData();

      this.caseForm.patchValue({
        patient_id: this.initialData.patient_id,
        practice_location_id: this.initialData.practice_location_id,
        category: this.initialData.category,
        case_type: this.initialData.case_type,
        priority: this.initialData.priority || CasePriority.NORMAL,
        purpose_of_visit: this.initialData.purpose_of_visit,
        date_of_accident: this.initialData.date_of_accident,
        insurance_id: this.initialData.insurance_id,
        firm_id: this.initialData.firm_id,
        referred_by: this.initialData.referred_by,
        referred_doctor_name: this.initialData.referred_doctor_name,
        opening_date: this.initialData.opening_date,
        closing_date: this.initialData.closing_date,
        clinical_notes: this.initialData.clinical_notes,
      });
    }
  }

  private seedSelectOptionsFromInitialData(): void {
    if (!this.initialData) {
      return;
    }

    const data = this.initialData as any;

    const patientOption =
      this.initialData.patient ||
      (data.patient_id
        ? {
            id: data.patient_id,
            first_name:
              typeof data.patient_name === 'string'
                ? data.patient_name.split(' ')[0] || 'Patient'
                : 'Patient',
            last_name:
              typeof data.patient_name === 'string'
                ? data.patient_name.split(' ').slice(1).join(' ') || ''
                : '',
            date_of_birth: data.patient?.date_of_birth || '-',
            gender: data.patient?.gender || 'other',
            patient_status: data.patient?.patient_status || 'active',
            registration_date:
              data.patient?.registration_date || new Date().toISOString(),
          }
        : null);

    const locationOption =
      this.initialData.practiceLocation ||
      (data.practice_location_id
        ? {
            id: data.practice_location_id,
            location_name:
              data.practice_location_name ||
              data.practiceLocation?.location_name ||
              'Selected location',
            address: data.practiceLocation?.address || '-',
            city: data.practiceLocation?.city || '-',
            state: data.practiceLocation?.state || '-',
            zip: data.practiceLocation?.zip || '-',
            phone: data.practiceLocation?.phone || '-',
            email: data.practiceLocation?.email || '-',
            is_active: true,
          }
        : null);

    const insuranceOption =
      this.initialData.insurance ||
      (data.insurance_id
        ? {
            id: data.insurance_id,
            insurance_name:
              data.insurance_name ||
              data.insurance?.insurance_name ||
              'Selected insurance',
            insurance_code: data.insurance?.insurance_code || '-',
            is_active: true,
          }
        : null);

    const firmOption =
      this.initialData.firm ||
      (data.firm_id
        ? {
            id: data.firm_id,
            firm_name:
              data.firm_name || data.firm?.firm_name || 'Selected firm',
            address: data.firm?.address || '-',
            contact_person: data.firm?.contact_person || '-',
            email: data.firm?.email || '-',
            phone: data.firm?.phone || '-',
            is_active: true,
          }
        : null);

    if (patientOption) {
      this.patients$.next([patientOption as Patient]);
    }
    if (locationOption) {
      this.practiceLocations$.next([locationOption as PracticeLocation]);
    }
    if (insuranceOption) {
      this.insurances$.next([insuranceOption as Insurance]);
    }
    if (firmOption) {
      this.firms$.next([firmOption as Firm]);
    }
  }

  // Search Loaders
  private loadPatients(term: string) {
    this.playersPatientSearch(term);
  }
  private playersPatientSearch(term: string) {
    this.patientService
      .getPatients({ search: term, per_page: this.searchableSelectPageSize })
      .subscribe((res) => {
        this.patients$.next(res.data);
      });
  }

  private loadLocations(term: string) {
    this.practiceLocationService
      .getPracticeLocations({
        search: term,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe((res) => {
        this.practiceLocations$.next(res.data);
      });
  }

  private loadInsurances(term: string) {
    this.insuranceService
      .getInsurances({ search: term, per_page: this.searchableSelectPageSize })
      .subscribe((res) => {
        this.insurances$.next(res.data);
      });
  }

  private loadFirms(term: string) {
    this.firmService
      .getFirms({ search: term, per_page: this.searchableSelectPageSize })
      .subscribe((res) => {
        this.firms$.next(res.data);
      });
  }

  // RxJS Setup for Debounced Typeaheads
  private setupPatientSearch() {
    this.patientSearchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.patientsLoading = true)),
        switchMap((term) =>
          this.patientService
            .getPatients({
              search: term,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] })),
              tap(() => (this.patientsLoading = false)),
            ),
        ),
      )
      .subscribe((res: any) => {
        this.patients$.next(res.data);
      });
  }

  private setupLocationSearch() {
    this.locationSearchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.locationsLoading = true)),
        switchMap((term) =>
          this.practiceLocationService
            .getPracticeLocations({
              search: term,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] })),
              tap(() => (this.locationsLoading = false)),
            ),
        ),
      )
      .subscribe((res: any) => {
        this.practiceLocations$.next(res.data);
      });
  }

  private setupInsuranceSearch() {
    this.insuranceSearchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.insurancesLoading = true)),
        switchMap((term) =>
          this.insuranceService
            .getInsurances({
              search: term,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] })),
              tap(() => (this.insurancesLoading = false)),
            ),
        ),
      )
      .subscribe((res: any) => {
        this.insurances$.next(res.data);
      });
  }

  private setupFirmSearch() {
    this.firmSearchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.firmsLoading = true)),
        switchMap((term) =>
          this.firmService
            .getFirms({ search: term, per_page: this.searchableSelectPageSize })
            .pipe(
              catchError(() => of({ data: [] })),
              tap(() => (this.firmsLoading = false)),
            ),
        ),
      )
      .subscribe((res: any) => {
        this.firms$.next(res.data);
      });
  }

  clearFields() {
    this.caseForm.reset({
      priority: CasePriority.NORMAL,
      opening_date: new Date().toISOString().split('T')[0],
    });
  }

  onCancel() {
    this.formCancel.emit();
  }

  onSubmit() {
    if (this.caseForm.invalid) {
      this.caseForm.markAllAsTouched();
      this.toastService.error('Please fill all required fields correctly.');
      return;
    }

    this.isSubmitting = true;
    const payload = this.caseForm.value;

    if (this.caseMode === 'create') {
      this.caseService.createCase(payload).subscribe({
        next: (res) => {
          this.toastService.success('Case created successfully');
          this.isSubmitting = false;
          this.formSuccess.emit(res.data.case);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastService.error(err.error?.message || 'Failed to create case');
        },
      });
    } else if (this.caseMode === 'edit' && this.initialData) {
      this.caseService.updateCase(this.initialData.id, payload).subscribe({
        next: (res) => {
          this.toastService.success('Case updated successfully');
          this.isSubmitting = false;
          this.formSuccess.emit(res.data.case);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastService.error(err.error?.message || 'Failed to update case');
        },
      });
    }
  }

  get patientControl() {
    return this.caseForm.get('patient_id');
  }

  get locationControl() {
    return this.caseForm.get('practice_location_id');
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.caseForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldErrorMessage(controlName: string): string {
    const control = this.caseForm.get(controlName);
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    const label = this.fieldLabels[controlName] || 'This field';
    const errors = control.errors;

    if (errors['required']) {
      return `${label} is required.`;
    }

    return `${label} is invalid.`;
  }
}
