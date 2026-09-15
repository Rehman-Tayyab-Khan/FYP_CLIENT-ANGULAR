import { CommonModule, Location } from '@angular/common';
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
import { AppointmentService } from '../../../core/services/appointment.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  CompleteAppointmentPayload,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from '../../../core/models/appointment.model';
import { ToastService } from '../../../core/services/toast.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import {
  BehaviorSubject,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CaseService } from '../../../core/services/case.service';
import { Case } from '../../../core/models/case.model';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { Specialty } from '../../../core/models/specialty.model';
import { PracticeLocationService } from '../../../core/services/practice-location.service';
import { PracticeLocation } from '../../../core/models/practice-location.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { DiagnosisService } from '../../../core/services/diagnosis.service';
import { Diagnosis } from '../../../core/models/diagnosis.model';
import { DoctorService } from '../../../core/services/doctor.service';
import { DoctorUser } from '../../../core/models/doctor.model';
import { VisitService } from '../../../core/services/visit.service';
import { Visit } from '../../../core/models/visit.model';

interface CaseOption extends Case {
  display_label: string;
}

interface DoctorOption {
  id: string;
  doctor_name: string;
  display_label: string;
}

interface DiagnosisOption extends Diagnosis {
  display_label: string;
}

type AppointmentWithOptionalVisit = Appointment & {
  visit?: Partial<Visit> | null;
};

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css'],
})
export class AppointmentFormComponent implements OnInit, OnChanges {
  @Input() appointmentToEdit: Appointment | null = null;
  @Output() formSuccess = new EventEmitter<Appointment>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly caseService = inject(CaseService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly diagnosisService = inject(DiagnosisService);
  private readonly doctorService = inject(DoctorService);
  private readonly visitService = inject(VisitService);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  private readonly searchableSelectPageSize =
    environment.searchableSelectPageSize;
  private readonly filterDebounceMs = environment.filterDebounceMs;

  cases$ = new Subject<CaseOption[]>();
  casesLoading = false;
  caseSearchInput$ = new Subject<string>();
  private caseOptions: CaseOption[] = [];

  doctors$ = new Subject<DoctorOption[]>();
  doctorsLoading = false;
  doctorSearchInput$ = new Subject<string>();

  specialties$ = new Subject<Specialty[]>();
  specialtiesLoading = false;
  specialtySearchInput$ = new Subject<string>();

  practiceLocations$ = new Subject<PracticeLocation[]>();
  locationsLoading = false;
  locationSearchInput$ = new Subject<string>();

  diagnoses$ = new BehaviorSubject<DiagnosisOption[]>([]);
  diagnosesLoading = false;
  diagnosisSearchInput$ = new Subject<string>();

  private diagnosisOptions: DiagnosisOption[] = [];

  readonly appointmentTypeOptions: AppointmentType[] = [
    'New Patient',
    'Follow-up',
    'Consultation',
    'Procedure',
    'Telehealth',
    'Emergency',
    'Routine Checkup',
    'Post-op Follow-up',
  ];

  readonly doctorStatusOptions: AppointmentStatus[] = [
    'Checked In',
    'In Progress',
    'Completed',
  ];

  isSubmitting = false;
  private loadedVisitForAppointmentId: string | null = null;

  private readonly fieldLabels: Record<string, string> = {
    case_id: 'Case',
    patient_id: 'Patient',
    doctor_id: 'Doctor',
    appointment_date: 'Date',
    appointment_time: 'Time',
    appointment_type: 'Type',
    specialty_id: 'Specialty',
    practice_location_id: 'Practice location',
    duration_minutes: 'Duration',
    reason_for_visit: 'Reason for visit',
    notes: 'Notes',
    status: 'Status',
    diagnoses_id: 'Diagnosis',
    diagnosis_icd_code: 'Diagnosis ICD code',
    diagnosis_description: 'Diagnosis description',
    symptoms: 'Symptoms',
    treatment: 'Treatment',
    prescription: 'Prescription',
    visit_notes: 'Visit notes',
  };

  form = this.fb.group({
    case_id: ['', [Validators.required]],
    patient_id: ['', [Validators.required]],
    doctor_id: ['', [Validators.required]],
    appointment_date: ['', [Validators.required]],
    appointment_time: ['', [Validators.required]],
    appointment_type: ['New Patient' as AppointmentType, [Validators.required]],
    specialty_id: ['', [Validators.required]],
    practice_location_id: ['', [Validators.required]],
    duration_minutes: [
      30,
      [Validators.required, Validators.min(5), Validators.max(480)],
    ],
    reason_for_visit: ['', [Validators.required, Validators.minLength(10)]],
    notes: ['', [Validators.maxLength(500)]],
    status: ['' as AppointmentStatus | ''],
    diagnosis_mode: ['existing' as 'existing' | 'new'],
    diagnoses_id: [''],
    diagnosis_icd_code: [''],
    diagnosis_description: [''],
    diagnosis_is_active: [true],
    visit_duration_minutes: [null as number | null],
    symptoms: [''],
    treatment: [''],
    treatment_plan: [''],
    prescription: [''],
    visit_notes: [''],
    follow_up_required: [false],
    follow_up_date: [''],
    referral_made: [false],
    referral_to: [''],
  });

  ngOnInit(): void {
    if (!this.doctorStatusOnlyMode) {
      this.setupCaseSearch();
      this.setupCaseSelectionSync();
      this.setupDoctorSearch();
      this.setupSpecialtySearch();
      this.setupLocationSearch();
    }

    this.setupDiagnosisSearch();

    if (this.appointmentToEdit) {
      this.patchFormValues();
      this.form.get('case_id')?.disable();
      this.form.get('patient_id')?.disable();
    } else {
      this.form.get('case_id')?.enable();
      this.form.get('patient_id')?.enable();
    }

    if (this.doctorStatusOnlyMode) {
      this.form.get('status')?.setValidators([Validators.required]);
      this.form.get('status')?.updateValueAndValidity({ emitEvent: false });

      Object.keys(this.form.controls).forEach((key) => {
        if (
          key !== 'status' &&
          key !== 'diagnosis_mode' &&
          key !== 'diagnoses_id' &&
          key !== 'diagnosis_icd_code' &&
          key !== 'diagnosis_description' &&
          key !== 'diagnosis_is_active' &&
          key !== 'visit_duration_minutes' &&
          key !== 'symptoms' &&
          key !== 'treatment' &&
          key !== 'treatment_plan' &&
          key !== 'prescription' &&
          key !== 'visit_notes' &&
          key !== 'follow_up_required' &&
          key !== 'follow_up_date' &&
          key !== 'referral_made' &&
          key !== 'referral_to'
        ) {
          this.form.get(key)?.disable({ emitEvent: false });
        }
      });

      this.setupDoctorCompletionMode();

      // In doctor status mode, only diagnosis data is required.
      // Avoid loading non-doctor dropdown sources that can be unauthorized.
      this.loadDiagnoses('');
      return;
    }

    this.loadCases('');
    this.loadDoctors('');
    this.loadSpecialties('');
    this.loadLocations('');
    this.loadDiagnoses('');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointmentToEdit'] && this.appointmentToEdit && this.form) {
      this.patchFormValues();
      this.form.get('case_id')?.disable();
      this.form.get('patient_id')?.disable();

      if (this.doctorStatusOnlyMode) {
        this.applyCompletedStatusLock();
        this.configureCompletionValidators();
      }
    }
  }

  get isEditMode(): boolean {
    return !!this.appointmentToEdit;
  }

  get isDoctorRole(): boolean {
    return this.authService.isDoctor();
  }

  get doctorStatusOnlyMode(): boolean {
    return this.isEditMode && this.isDoctorRole;
  }

  get completionMode(): 'existing' | 'new' {
    return (
      (this.form.get('diagnosis_mode')?.value as 'existing' | 'new') ||
      'existing'
    );
  }

  get isCompletionStatusSelected(): boolean {
    return this.form.get('status')?.value === 'Completed';
  }

  get isCompletedStatusLocked(): boolean {
    return (
      this.doctorStatusOnlyMode &&
      this.appointmentToEdit?.status === 'Completed'
    );
  }

  private patchFormValues(): void {
    if (!this.appointmentToEdit) {
      return;
    }

    if (this.loadedVisitForAppointmentId !== this.appointmentToEdit.id) {
      this.loadedVisitForAppointmentId = null;
    }

    this.seedSelectOptionsFromInitialData();

    const visitData = this.getVisitDataFromAppointment();
    const diagnosisMode = this.resolveDiagnosisMode(visitData);

    this.form.patchValue({
      case_id: this.appointmentToEdit.case_id,
      patient_id: this.appointmentToEdit.patient_id,
      doctor_id: this.appointmentToEdit.doctor_id,
      appointment_date: this.appointmentToEdit.appointment_date,
      appointment_time: this.normalizeTime(
        this.appointmentToEdit.appointment_time,
      ),
      appointment_type: this.appointmentToEdit.appointment_type,
      specialty_id: this.appointmentToEdit.specialty_id,
      practice_location_id: this.appointmentToEdit.practice_location_id,
      duration_minutes: this.appointmentToEdit.duration_minutes,
      reason_for_visit: this.appointmentToEdit.reason_for_visit,
      notes: this.appointmentToEdit.notes,
      status: this.appointmentToEdit.status,
      diagnosis_mode: diagnosisMode,
      diagnoses_id: visitData?.diagnoses_id || '',
      diagnosis_icd_code: visitData?.diagnoses_icd_code || '',
      diagnosis_description:
        visitData?.diagnoses_description || visitData?.diagnoses_name || '',
      diagnosis_is_active: visitData?.diagnoses_is_active ?? true,
      visit_duration_minutes: visitData?.visit_duration_minutes ?? null,
      symptoms: visitData?.symptoms || '',
      treatment: visitData?.treatment || '',
      treatment_plan: visitData?.treatment_plan || '',
      prescription: visitData?.prescription || '',
      visit_notes: visitData?.notes || '',
      follow_up_required: !!visitData?.follow_up_required,
      follow_up_date: this.normalizeDateForInput(visitData?.follow_up_date),
      referral_made: !!visitData?.referral_made,
      referral_to: visitData?.referral_to || '',
    });

    if (visitData?.diagnoses_id) {
      this.seedDiagnosisOptionFromVisit(visitData);
    }

    this.loadVisitDetailsForEdit();
  }

  private getVisitDataFromAppointment(): Partial<Visit> | null {
    const appointment = this.appointmentToEdit as AppointmentWithOptionalVisit;
    return appointment?.visit || null;
  }

  private resolveDiagnosisMode(
    visitData: Partial<Visit> | null,
  ): 'existing' | 'new' {
    if (visitData?.diagnoses_id) {
      return 'existing';
    }

    if (visitData?.diagnoses_icd_code || visitData?.diagnoses_description) {
      return 'new';
    }

    return 'existing';
  }

  private normalizeDateForInput(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private seedDiagnosisOptionFromVisit(visitData: Partial<Visit>): void {
    if (!visitData.diagnoses_id) {
      return;
    }

    const alreadyExists = this.diagnosisOptions.some(
      (option) => option.id === visitData.diagnoses_id,
    );

    if (alreadyExists) {
      return;
    }

    const icdCode = visitData.diagnoses_icd_code || 'Unknown ICD';
    const diagnosisName =
      visitData.diagnoses_name ||
      visitData.diagnoses_description ||
      'Diagnosis';

    this.diagnosisOptions = [
      {
        id: visitData.diagnoses_id,
        icd_code: icdCode,
        diagnoses_name: diagnosisName,
        description: visitData.diagnoses_description || diagnosisName,
        is_active: visitData.diagnoses_is_active ?? true,
        display_label: `${icdCode} - ${diagnosisName}`,
      } as DiagnosisOption,
      ...this.diagnosisOptions,
    ];

    this.diagnoses$.next(this.diagnosisOptions);
  }

  private loadVisitDetailsForEdit(): void {
    if (!this.doctorStatusOnlyMode || !this.appointmentToEdit?.visit_id) {
      return;
    }

    if (this.loadedVisitForAppointmentId === this.appointmentToEdit.id) {
      return;
    }

    this.loadedVisitForAppointmentId = this.appointmentToEdit.id;

    this.visitService.getVisitById(this.appointmentToEdit.visit_id).subscribe({
      next: (response) => {
        // Do not clobber values the doctor already edited while async data was loading.
        if (this.hasUserEditedCompletionDetails()) {
          return;
        }

        const visit = response.data;

        this.seedDiagnosisOptionFromVisit(visit);

        this.form.patchValue(
          {
            diagnosis_mode: this.resolveDiagnosisMode(visit),
            diagnoses_id: visit.diagnoses_id || '',
            diagnosis_icd_code: visit.diagnoses_icd_code || '',
            diagnosis_description:
              visit.diagnoses_description || visit.diagnoses_name || '',
            diagnosis_is_active: visit.diagnoses_is_active ?? true,
            visit_duration_minutes: visit.visit_duration_minutes ?? null,
            symptoms: visit.symptoms || '',
            treatment: visit.treatment || '',
            treatment_plan: visit.treatment_plan || '',
            prescription: visit.prescription || '',
            visit_notes: visit.notes || '',
            follow_up_required: !!visit.follow_up_required,
            follow_up_date: this.normalizeDateForInput(visit.follow_up_date),
            referral_made: !!visit.referral_made,
            referral_to: visit.referral_to || '',
          },
          { emitEvent: false },
        );

        this.configureCompletionValidators();
      },
      error: () => {
        this.loadedVisitForAppointmentId = null;
      },
    });
  }

  private hasUserEditedCompletionDetails(): boolean {
    const completionControls = [
      'diagnosis_mode',
      'diagnoses_id',
      'diagnosis_icd_code',
      'diagnosis_description',
      'visit_duration_minutes',
      'symptoms',
      'treatment',
      'treatment_plan',
      'prescription',
      'visit_notes',
      'follow_up_required',
      'follow_up_date',
      'referral_made',
      'referral_to',
    ];

    return completionControls.some((name) => !!this.form.get(name)?.dirty);
  }

  private applyCompletedStatusLock(): void {
    if (!this.doctorStatusOnlyMode) {
      return;
    }

    const statusControl = this.form.get('status');

    if (this.isCompletedStatusLocked) {
      statusControl?.setValue('Completed', { emitEvent: false });
      statusControl?.disable({ emitEvent: false });
      return;
    }

    statusControl?.enable({ emitEvent: false });
  }

  private setupDoctorCompletionMode(): void {
    this.form
      .get('status')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((status) => {
        if (status === 'Completed' && this.diagnosisOptions.length === 0) {
          this.loadDiagnoses('');
        }

        this.configureCompletionValidators();
      });

    this.form
      .get('diagnosis_mode')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        this.configureCompletionValidators();
      });

    this.form
      .get('diagnoses_id')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((diagnosesId) => {
        if (
          !this.isCompletionStatusSelected ||
          this.completionMode !== 'existing'
        ) {
          return;
        }

        const selected = this.diagnosisOptions.find(
          (option) => String(option.id) === String(diagnosesId),
        );
        this.form.patchValue(
          {
            diagnosis_description: selected?.description || '',
          },
          { emitEvent: false },
        );
      });

    this.form
      .get('follow_up_required')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        this.configureCompletionValidators();
      });

    this.form
      .get('referral_made')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        this.configureCompletionValidators();
      });

    this.configureCompletionValidators();
    this.applyCompletedStatusLock();
  }

  private configureCompletionValidators(): void {
    if (!this.doctorStatusOnlyMode) {
      return;
    }

    const completionControls = [
      'diagnosis_mode',
      'diagnoses_id',
      'diagnosis_icd_code',
      'diagnosis_description',
      'diagnosis_is_active',
      'visit_duration_minutes',
      'symptoms',
      'treatment',
      'treatment_plan',
      'prescription',
      'visit_notes',
      'follow_up_required',
      'follow_up_date',
      'referral_made',
      'referral_to',
    ];

    const isCompleted = this.isCompletionStatusSelected;

    if (!isCompleted) {
      completionControls.forEach((name) => {
        const control = this.form.get(name);
        control?.clearValidators();
        control?.setValue(
          name === 'diagnosis_mode'
            ? 'existing'
            : name === 'diagnosis_is_active'
              ? true
              : name === 'follow_up_required' || name === 'referral_made'
                ? false
                : name === 'visit_duration_minutes'
                  ? null
                  : '',
          { emitEvent: false },
        );
        control?.disable({ emitEvent: false });
        control?.updateValueAndValidity({ emitEvent: false });
      });

      return;
    }

    completionControls.forEach((name) => {
      this.form.get(name)?.enable({ emitEvent: false });
    });

    const diagnosisMode = this.completionMode;

    this.form.get('diagnosis_mode')?.setValidators([Validators.required]);
    this.form
      .get('visit_duration_minutes')
      ?.setValidators([Validators.min(1), Validators.max(1440)]);
    this.form.get('symptoms')?.setValidators([Validators.required]);
    this.form.get('treatment')?.setValidators([Validators.required]);
    this.form.get('prescription')?.setValidators([Validators.required]);
    this.form.get('visit_notes')?.setValidators([Validators.required]);

    if (diagnosisMode === 'existing') {
      this.form.get('diagnoses_id')?.setValidators([Validators.required]);
      this.form.get('diagnosis_icd_code')?.clearValidators();
      this.form.get('diagnosis_description')?.clearValidators();
    } else {
      this.form.get('diagnoses_id')?.clearValidators();
      this.form.get('diagnosis_icd_code')?.setValidators([Validators.required]);
      this.form
        .get('diagnosis_description')
        ?.setValidators([Validators.required]);
    }

    if (this.form.get('follow_up_required')?.value) {
      this.form.get('follow_up_date')?.setValidators([Validators.required]);
    } else {
      this.form.get('follow_up_date')?.clearValidators();
      this.form.get('follow_up_date')?.setValue('', { emitEvent: false });
    }

    if (this.form.get('referral_made')?.value) {
      this.form.get('referral_to')?.setValidators([Validators.required]);
    } else {
      this.form.get('referral_to')?.clearValidators();
      this.form.get('referral_to')?.setValue('', { emitEvent: false });
    }

    completionControls.forEach((name) => {
      this.form.get(name)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private seedSelectOptionsFromInitialData(): void {
    if (!this.appointmentToEdit) {
      return;
    }

    const patientName = this.appointmentToEdit.patient_name || 'Patient';

    const caseOption: CaseOption = {
      id: this.appointmentToEdit.case_id,
      case_number: this.appointmentToEdit.case_number || 'Selected case',
      patient_id: this.appointmentToEdit.patient_id,
      practice_location_id: this.appointmentToEdit.practice_location_id,
      category: 'General Medicine' as any,
      purpose_of_visit: this.appointmentToEdit.reason_for_visit,
      case_type: 'Initial Consultation' as any,
      priority: 'Normal' as any,
      case_status: 'Active' as any,
      opening_date: this.appointmentToEdit.appointment_date,
      display_label: this.appointmentToEdit.case_number
        ? `${this.appointmentToEdit.case_number} • ${patientName}`
        : 'Selected case',
    };

    const doctorName = this.appointmentToEdit.doctor_name || 'Selected doctor';
    const specialtyName = this.appointmentToEdit.specialty_name || '';
    const doctorOption: DoctorOption = {
      id: this.appointmentToEdit.doctor_id,
      doctor_name: doctorName,
      display_label: specialtyName
        ? `${doctorName} • ${specialtyName}`
        : doctorName,
    };

    const specialtyOption: Specialty = {
      id: this.appointmentToEdit.specialty_id,
      specialty_name:
        this.appointmentToEdit.specialty_name || 'Selected specialty',
      is_active: true,
    };

    const locationOption: PracticeLocation = {
      id: this.appointmentToEdit.practice_location_id,
      location_name:
        this.appointmentToEdit.practice_location_name || 'Selected location',
      address: '-',
      city: '-',
      state: '-',
      zip: '-',
      phone: '-',
      email: '-',
      is_active: true,
    };

    this.caseOptions = [caseOption];
    this.cases$.next(this.caseOptions);
    this.doctors$.next([doctorOption]);
    this.specialties$.next([specialtyOption]);
    this.practiceLocations$.next([locationOption]);
  }

  private normalizeTime(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private mapCaseOptions(cases: Case[]): CaseOption[] {
    return cases.map((caseItem: any) => {
      const patientName = caseItem.patient
        ? `${caseItem.patient.first_name} ${caseItem.patient.last_name}`
        : caseItem.patient_name || '';

      return {
        ...caseItem,
        display_label: patientName
          ? `${caseItem.case_number} • ${patientName}`
          : caseItem.case_number,
      } as CaseOption;
    });
  }

  private mapDoctorOptions(doctors: DoctorUser[]): DoctorOption[] {
    const unique = new Map<string, DoctorOption>();

    doctors.forEach((doctor) => {
      const doctorProfileId = doctor.doctorProfile?.id;
      if (!doctorProfileId) {
        return;
      }

      const doctorName =
        `${doctor.first_name ?? ''} ${doctor.last_name ?? ''}`.trim();
      if (!doctorName) {
        return;
      }

      const specialtyName = doctor.doctorProfile?.specialty?.specialty_name;

      unique.set(doctorProfileId, {
        id: doctorProfileId,
        doctor_name: doctorName,
        display_label: specialtyName
          ? `${doctorName} • ${specialtyName}`
          : doctorName,
      });
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.doctor_name.localeCompare(b.doctor_name),
    );
  }

  private mapDiagnosisOptions(diagnoses: Diagnosis[]): DiagnosisOption[] {
    return diagnoses.map((diagnosis) => ({
      ...diagnosis,
      display_label: `${diagnosis.icd_code} - ${diagnosis.diagnoses_name}`,
    }));
  }

  private loadCases(term: string): void {
    this.caseService
      .getCases({ search: term, per_page: this.searchableSelectPageSize })
      .subscribe((response) => {
        this.caseOptions = this.mapCaseOptions(response.data);
        this.cases$.next(this.caseOptions);
        this.syncPatientIdFromSelectedCase(this.form.get('case_id')?.value);
      });
  }

  private loadDoctors(term: string): void {
    this.doctorService
      .getDoctors({
        search: term,
        is_active: true,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe((response) => {
        this.doctors$.next(this.mapDoctorOptions(response.data));
      });
  }

  private loadSpecialties(term: string): void {
    this.specialtyService
      .getSpecialties({
        search: term,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe((response) => {
        this.specialties$.next(response.data);
      });
  }

  private loadLocations(term: string): void {
    this.practiceLocationService
      .getPracticeLocations({
        search: term,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe((response) => {
        this.practiceLocations$.next(response.data);
      });
  }

  private loadDiagnoses(term: string): void {
    this.diagnosisService
      .getDiagnoses({
        search: term,
        is_active: true,
        per_page: this.searchableSelectPageSize,
      })
      .subscribe((response) => {
        this.diagnosisOptions = this.mapDiagnosisOptions(response.data);
        this.diagnoses$.next(this.diagnosisOptions);
      });
  }

  private setupCaseSearch(): void {
    this.caseSearchInput$
      .pipe(
        debounceTime(this.filterDebounceMs),
        distinctUntilChanged(),
        tap(() => (this.casesLoading = true)),
        switchMap((term) =>
          this.caseService
            .getCases({ search: term, per_page: this.searchableSelectPageSize })
            .pipe(
              catchError(() => of({ data: [] as Case[] } as any)),
              tap(() => (this.casesLoading = false)),
            ),
        ),
      )
      .subscribe((response: any) => {
        this.caseOptions = this.mapCaseOptions(response.data || []);
        this.cases$.next(this.caseOptions);
        this.syncPatientIdFromSelectedCase(this.form.get('case_id')?.value);
      });
  }

  private setupCaseSelectionSync(): void {
    this.form
      .get('case_id')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((caseId) => {
        this.syncPatientIdFromSelectedCase(caseId);
      });
  }

  private syncPatientIdFromSelectedCase(caseId: unknown): void {
    const selectedCase = this.caseOptions.find(
      (caseOption) => String(caseOption.id) === String(caseId ?? ''),
    );

    this.form.patchValue(
      {
        patient_id: selectedCase?.patient_id || '',
      },
      { emitEvent: false },
    );
  }

  private setupDoctorSearch(): void {
    this.doctorSearchInput$
      .pipe(
        debounceTime(this.filterDebounceMs),
        distinctUntilChanged(),
        tap(() => (this.doctorsLoading = true)),
        switchMap((term) =>
          this.doctorService
            .getDoctors({
              search: term,
              is_active: true,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] as DoctorUser[] } as any)),
              tap(() => (this.doctorsLoading = false)),
            ),
        ),
      )
      .subscribe((response: any) => {
        this.doctors$.next(this.mapDoctorOptions(response.data || []));
      });
  }

  private setupSpecialtySearch(): void {
    this.specialtySearchInput$
      .pipe(
        debounceTime(this.filterDebounceMs),
        distinctUntilChanged(),
        tap(() => (this.specialtiesLoading = true)),
        switchMap((term) =>
          this.specialtyService
            .getSpecialties({
              search: term,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] as Specialty[] } as any)),
              tap(() => (this.specialtiesLoading = false)),
            ),
        ),
      )
      .subscribe((response: any) => {
        this.specialties$.next(response.data || []);
      });
  }

  private setupLocationSearch(): void {
    this.locationSearchInput$
      .pipe(
        debounceTime(this.filterDebounceMs),
        distinctUntilChanged(),
        tap(() => (this.locationsLoading = true)),
        switchMap((term) =>
          this.practiceLocationService
            .getPracticeLocations({
              search: term,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] as PracticeLocation[] } as any)),
              tap(() => (this.locationsLoading = false)),
            ),
        ),
      )
      .subscribe((response: any) => {
        this.practiceLocations$.next(response.data || []);
      });
  }

  private setupDiagnosisSearch(): void {
    this.diagnosisSearchInput$
      .pipe(
        debounceTime(this.filterDebounceMs),
        distinctUntilChanged(),
        tap(() => (this.diagnosesLoading = true)),
        switchMap((term) =>
          this.diagnosisService
            .getDiagnoses({
              search: term,
              is_active: true,
              per_page: this.searchableSelectPageSize,
            })
            .pipe(
              catchError(() => of({ data: [] as Diagnosis[] } as any)),
              tap(() => (this.diagnosesLoading = false)),
            ),
        ),
      )
      .subscribe((response: any) => {
        this.diagnosisOptions = this.mapDiagnosisOptions(response.data || []);
        this.diagnoses$.next(this.diagnosisOptions);
      });
  }

  onCaseSearch(term: string | Event): void {
    this.caseSearchInput$.next(typeof term === 'string' ? term : '');
  }

  onDoctorSearch(term: string | Event): void {
    this.doctorSearchInput$.next(typeof term === 'string' ? term : '');
  }

  onSpecialtySearch(term: string | Event): void {
    this.specialtySearchInput$.next(typeof term === 'string' ? term : '');
  }

  onLocationSearch(term: string | Event): void {
    this.locationSearchInput$.next(typeof term === 'string' ? term : '');
  }

  onDiagnosisSearch(term: string | Event): void {
    if (typeof term === 'string') {
      this.diagnosisSearchInput$.next(term);
      return;
    }

    const eventTarget = term.target as HTMLInputElement | null;
    this.diagnosisSearchInput$.next(eventTarget?.value || '');
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

    if (errors['min']) {
      return `${label} must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      return `${label} cannot exceed ${errors['max'].max}.`;
    }

    return `${label} is invalid.`;
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
      return;
    }

    const value = this.form.getRawValue();

    if (
      this.doctorStatusOnlyMode &&
      this.isCompletedStatusLocked &&
      value.status !== 'Completed'
    ) {
      this.toastService.error(
        'Completed appointments cannot be moved to another status.',
      );
      return;
    }

    if (this.doctorStatusOnlyMode && this.appointmentToEdit) {
      if (value.status === 'Completed') {
        const completionPayload: CompleteAppointmentPayload = {
          ...(value.diagnosis_mode === 'existing'
            ? { diagnoses_id: value.diagnoses_id || undefined }
            : {
                diagnosis_icd_code:
                  value.diagnosis_icd_code?.trim() || undefined,
                diagnosis_description:
                  value.diagnosis_description?.trim() || undefined,
                diagnosis_is_active: !!value.diagnosis_is_active,
              }),
          visit_duration_minutes: value.visit_duration_minutes || undefined,
          symptoms: value.symptoms?.trim() || '',
          treatment: value.treatment?.trim() || '',
          treatment_plan: value.treatment_plan?.trim() || undefined,
          prescription: value.prescription?.trim() || '',
          notes: value.visit_notes?.trim() || '',
          follow_up_required: !!value.follow_up_required,
          follow_up_date: value.follow_up_required
            ? value.follow_up_date || null
            : null,
          referral_made: !!value.referral_made,
          referral_to: value.referral_made
            ? value.referral_to?.trim() || null
            : null,
        };

        this.isSubmitting = true;

        this.appointmentService
          .completeAppointmentByDoctor(
            this.appointmentToEdit.id,
            completionPayload,
          )
          .subscribe({
            next: (response) => {
              this.isSubmitting = false;
              this.formSuccess.emit(response.data.appointment);
              if (!this.formSuccess.observed) {
                this.location.back();
              }
            },
            error: (error) => {
              this.isSubmitting = false;
              const errorMsg =
                error?.error?.message ||
                'Failed to complete appointment with visit details';
              this.toastService.error(errorMsg);
            },
          });

        return;
      }

      const updatePayload: UpdateAppointmentPayload = {
        status: value.status as AppointmentStatus,
      };

      this.isSubmitting = true;

      this.appointmentService
        .updateAppointment(this.appointmentToEdit.id, updatePayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.formSuccess.emit(response.data.appointment);
            if (!this.formSuccess.observed) {
              this.location.back();
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            const errorMsg =
              error?.error?.message || 'Failed to update appointment status';
            this.toastService.error(errorMsg);
          },
        });

      return;
    }

    if (!value.patient_id) {
      this.toastService.error(
        'Patient could not be resolved from the selected case.',
      );
      return;
    }

    const payload: CreateAppointmentPayload = {
      case_id: value.case_id || '',
      patient_id: value.patient_id || '',
      doctor_id: value.doctor_id || '',
      appointment_date: value.appointment_date || '',
      appointment_time: value.appointment_time || '',
      appointment_type: (value.appointment_type ||
        'New Patient') as AppointmentType,
      specialty_id: value.specialty_id || '',
      practice_location_id: value.practice_location_id || '',
      duration_minutes: value.duration_minutes || 30,
      reason_for_visit: value.reason_for_visit?.trim() || '',
      notes: value.notes?.trim() || undefined,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.appointmentToEdit) {
      const updatePayload: UpdateAppointmentPayload = {
        doctor_id: value.doctor_id || undefined,
        appointment_date: value.appointment_date || undefined,
        appointment_time: value.appointment_time || undefined,
        appointment_type:
          (value.appointment_type as AppointmentType | undefined) || undefined,
        specialty_id: value.specialty_id || undefined,
        practice_location_id: value.practice_location_id || undefined,
        duration_minutes: value.duration_minutes || undefined,
        reason_for_visit: value.reason_for_visit?.trim() || undefined,
        notes: value.notes?.trim() || undefined,
      };

      this.appointmentService
        .updateAppointment(this.appointmentToEdit.id, updatePayload)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.formSuccess.emit(response.data.appointment);
            if (!this.formSuccess.observed) {
              this.location.back();
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            const errorMsg =
              error?.error?.message || 'Failed to update appointment';
            this.toastService.error(errorMsg);
          },
        });
    } else {
      //INFO: Create new appointment
      this.appointmentService.createAppointment(payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.formSuccess.emit(response.data.appointment);
          if (!this.formSuccess.observed) {
            this.location.back();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          const errorMsg =
            error?.error?.message || 'Failed to create appointment';
          this.toastService.error(errorMsg);
        },
      });
    }
  }
}
