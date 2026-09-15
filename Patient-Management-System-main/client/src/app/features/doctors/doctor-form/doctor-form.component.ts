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
import { catchError, forkJoin, of } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import {
  CreateDoctorPayload,
  DoctorUser,
  UpdateDoctorPayload,
} from '../../../core/models/doctor.model';
import { Specialty } from '../../../core/models/specialty.model';
import { PracticeLocation } from '../../../core/models/practice-location.model';
import { DoctorService } from '../../../core/services/doctor.service';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { PracticeLocationService } from '../../../core/services/practice-location.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './doctor-form.component.html',
})
export class DoctorFormComponent implements OnInit, OnChanges {
  @Input() doctorId: string | null = null;
  @Output() formSuccess = new EventEmitter<DoctorUser>();
  @Output() formCancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly doctorService = inject(DoctorService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly practiceLocationService = inject(PracticeLocationService);
  private readonly toastService = inject(ToastService);

  loading = false;
  specialtiesLoading = false;
  practiceLocationsLoading = false;
  isSubmitting = false;
  scheduleError = '';

  currentDoctor: DoctorUser | null = null;
  specialties: Specialty[] = [];
  practiceLocations: PracticeLocation[] = [];
  readonly timeOptions = this.buildTimeOptions();

  readonly weekdayConfig = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ] as const;

  dayAvailability: Array<{
    key: string;
    label: string;
    enabled: boolean;
    start: string;
    end: string;
  }> = this.weekdayConfig.map((day) => ({
    ...day,
    enabled: false,
    start: '09:00',
    end: '17:00',
  }));

  form = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
    ],
    phone: ['', [Validators.required]],
    is_active: [true, [Validators.required]],
    specialty_id: ['', [Validators.required]],
    practice_location_id: ['', [Validators.required]],
    license_number: ['', [Validators.required]],
    bio: ['', [Validators.maxLength(500)]],
  });

  get isCreateMode(): boolean {
    return !this.doctorId;
  }

  ngOnInit(): void {
    this.applyModeValidators();

    // Create page uses this component without Input binding,
    // so ngOnChanges is not triggered there.
    if (this.isCreateMode) {
      this.loadOptionsOnly();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // this is made so that if there is create mode then email and password are required, but if its edit mode then they are optional and can be left empty to keep unchanged.
    this.applyModeValidators();

    if (this.isCreateMode) {
      this.currentDoctor = null;
      this.form.reset({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        is_active: true,
        specialty_id: '',
        practice_location_id: '',
        license_number: '',
        bio: '',
      });
      this.resetAvailability();
      this.scheduleError = '';
      this.loadOptionsOnly();
      return;
    }

    if (changes['doctorId'] && this.doctorId) {
      this.loadForm(this.doctorId);
    }
  }

  private applyModeValidators(): void {
    const emailControl = this.form.get('email');
    const passwordControl = this.form.get('password');

    if (!emailControl || !passwordControl) {
      return;
    }

    if (this.isCreateMode) {
      emailControl.setValidators([Validators.required, Validators.email]);
      emailControl.enable({ emitEvent: false });
      passwordControl.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
      ]);
      passwordControl.setValue('', { emitEvent: false });
    } else {
      emailControl.clearValidators();
      emailControl.disable({ emitEvent: false });
      passwordControl.setValidators([
        Validators.minLength(6),
        Validators.maxLength(100),
      ]);
      emailControl.setValue('', { emitEvent: false });
      passwordControl.setValue('', { emitEvent: false });
      // emailControl.enable({ emitEvent: false });
      // passwordControl.enable({ emitEvent: false });
    }

    emailControl.updateValueAndValidity({ emitEvent: false });
    passwordControl.updateValueAndValidity({ emitEvent: false });
  }

  private loadOptionsOnly(): void {
    this.loading = true;
    this.specialtiesLoading = true;
    this.practiceLocationsLoading = true;

    forkJoin({
      specialties: this.specialtyService
        .getSpecialties({
          per_page: 10,
        })
        .pipe(catchError(() => of({ data: [] as Specialty[] } as any))),
      practiceLocations: this.practiceLocationService
        .getPracticeLocations({
          per_page: 10,
        })
        .pipe(catchError(() => of({ data: [] as PracticeLocation[] } as any))),
    }).subscribe({
      next: ({ specialties, practiceLocations }) => {
        this.specialties = specialties.data;
        this.practiceLocations = practiceLocations.data;
        this.specialtiesLoading = false;
        this.practiceLocationsLoading = false;
        this.loading = false;
      },
      error: () => {
        this.specialties = [];
        this.practiceLocations = [];
        this.specialtiesLoading = false;
        this.practiceLocationsLoading = false;
        this.loading = false;
      },
    });
  }

  private loadForm(id: string): void {
    this.loading = true;
    this.specialtiesLoading = true;
    this.practiceLocationsLoading = true;

    forkJoin({
      doctorResponse: this.doctorService.getDoctorById(id),
      specialties: this.specialtyService
        .getSpecialties({
          per_page: 10,
        })
        .pipe(catchError(() => of({ data: [] as Specialty[] } as any))),
      practiceLocations: this.practiceLocationService
        .getPracticeLocations({
          per_page: 10,
        })
        .pipe(catchError(() => of({ data: [] as PracticeLocation[] } as any))),
    }).subscribe({
      next: ({ doctorResponse, specialties, practiceLocations }) => {
        const doctor = doctorResponse.data.user;
        this.currentDoctor = doctor;
        this.specialties = specialties.data;
        this.practiceLocations = practiceLocations.data;
        const profile = doctor.doctorProfile;
        //INFO: if the specialty is not in the first 10 manually add it to the list
        if (profile?.specialty?.id) {
          const exists = this.specialties.some(
            (s) => s.id === profile.specialty?.id,
          );
          if (!exists) {
            this.specialties = [
              {
                id: profile.specialty.id,
                specialty_name:
                  profile.specialty.specialty_name || 'Selected specialty',
                is_active: true,
              },
              ...this.specialties,
            ];
          }
        }

        if (profile?.practiceLocation?.id) {
          const exists = this.practiceLocations.some(
            (location) => location.id === profile.practiceLocation?.id,
          );
          if (!exists) {
            this.practiceLocations = [
              {
                id: profile.practiceLocation.id,
                location_name:
                  profile.practiceLocation.location_name || 'Selected location',
                address: profile.practiceLocation.address || '-',
                city: profile.practiceLocation.city || '-',
                state: profile.practiceLocation.state || '-',
                zip: profile.practiceLocation.zip || '-',
                phone: profile.practiceLocation.phone || '-',
                email: profile.practiceLocation.email || '-',
                is_active:
                  profile.practiceLocation.is_active === undefined
                    ? true
                    : profile.practiceLocation.is_active,
              },
              ...this.practiceLocations,
            ];
          }
        }

        this.form.patchValue({
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          phone: doctor.phone || '',
          is_active: doctor.is_active,
          specialty_id: profile?.specialty_id || '',
          practice_location_id: profile?.practice_location_id || '',
          license_number: profile?.license_number || '',
          email: doctor.email || '',
          bio: profile?.bio || '',
        });

       
        this.hydrateAvailability(profile?.availability_schedule);
        

        this.scheduleError = '';
        this.specialtiesLoading = false;
        this.practiceLocationsLoading = false;
        this.loading = false;
      },
      error: () => {
        this.specialtiesLoading = false;
        this.practiceLocationsLoading = false;
        this.loading = false;
      },
    });
  }

  onSpecialtySearch(term: string | Event): void {
    const search = typeof term === 'string' ? term : '';
    this.specialtiesLoading = true;

    this.specialtyService
      .getSpecialties({
        search,
        per_page: 10,
      })
      .pipe(catchError(() => of({ data: [] as Specialty[] } as any)))
      .subscribe((response) => {
        this.specialties = response.data;
        this.specialtiesLoading = false;
      });
  }

  onPracticeLocationSearch(term: string | Event): void {
    const search = typeof term === 'string' ? term : '';
    this.practiceLocationsLoading = true;

    this.practiceLocationService
      .getPracticeLocations({
        search,
        per_page: 10,
      })
      .pipe(catchError(() => of({ data: [] as PracticeLocation[] } as any)))
      .subscribe((response) => {
        this.practiceLocations = response.data;
        this.practiceLocationsLoading = false;
      });
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const scheduleParseResult = this.buildAvailabilitySchedule();

    if (scheduleParseResult === null) {
      return;
    }

    if (this.isCreateMode) {
      const payload: CreateDoctorPayload = {
        role: 'doctor',
        first_name: (value.first_name || '').trim(),
        last_name: (value.last_name || '').trim(),
        email: (value.email || '').trim(),
        password: value.password || '',
        phone: (value.phone || '').trim(),
        is_active: !!value.is_active,
        specialty_id: value.specialty_id || '',
        practice_location_id: value.practice_location_id || '',
        license_number: (value.license_number || '').trim(),
        ...(value.bio?.trim() ? { bio: value.bio.trim() } : {}),
        ...(scheduleParseResult !== undefined
          ? { availability_schedule: scheduleParseResult }
          : {}),
      };

      this.isSubmitting = true;
      this.doctorService.createDoctor(payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Doctor created successfully');
          this.formSuccess.emit(response.data.user);
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
      return;
    }

    if (!this.currentDoctor) {
      return;
    }

    const payload: UpdateDoctorPayload = {
      role: 'doctor',
      first_name: value.first_name?.trim(),
      last_name: value.last_name?.trim(),
      phone: value.phone?.trim(),
      is_active: !!value.is_active,
      specialty_id: value.specialty_id || undefined,
      practice_location_id: value.practice_location_id || undefined,
      license_number: value.license_number?.trim(),
      ...(value.bio?.trim() ? { bio: value.bio.trim() } : {}),
      ...(value.password ? { password: value.password } : {}),
      ...(scheduleParseResult
        ? { availability_schedule: scheduleParseResult }
        : { availability_schedule: null }),
    };

    this.isSubmitting = true;

    this.doctorService.updateDoctor(this.currentDoctor.id, payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success('Doctor updated successfully');
        this.formSuccess.emit(response.data.user);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }

  toggleDay(dayKey: string, enabled: boolean): void {
    const day = this.dayAvailability.find((d) => d.key === dayKey);
    if (!day) {
      return;
    }

    day.enabled = enabled;
    this.scheduleError = '';
  }

  updateDayTime(
    dayKey: string,
    field: 'start' | 'end',
    newValue: string,
  ): void {
    const day = this.dayAvailability.find((d) => d.key === dayKey);
    if (!day) {
      return;
    }

    day[field] = newValue;
    this.scheduleError = '';
  }

  private buildAvailabilitySchedule():
    | Record<string, string[]>
    | undefined
    | null {
    this.scheduleError = '';

    const schedule: Record<string, string[]> = {};

    for (const day of this.dayAvailability) {
      if (!day.enabled) {
        continue;
      }

      if (!day.start || !day.end) {
        this.scheduleError = `Please select both start and end time for ${day.label}.`;
        return null;
      }

      if (day.start >= day.end) {
        this.scheduleError = `${day.label} end time must be after start time.`;
        return null;
      }

      schedule[day.key] = [`${day.start}-${day.end}`];
    }

    if (!Object.keys(schedule).length) {
      return undefined;
    }

    return schedule;
  }

  private hydrateAvailability(rawSchedule: unknown): void {
    this.resetAvailability();

    if (!rawSchedule || typeof rawSchedule !== 'object') {
      return;
    }

    const schedule = rawSchedule as Record<string, unknown>;

    for (const day of this.dayAvailability) {
      const dayValue = schedule[day.key];

      if (Array.isArray(dayValue) && typeof dayValue[0] === 'string') {
        const [start, end] = (dayValue[0] as string).split('-');
        if (this.isValidTime(start) && this.isValidTime(end)) {
          day.enabled = true;
          day.start = start;
          day.end = end;
        }
        continue;
      }

      if (dayValue && typeof dayValue === 'object') {
        const from = (dayValue as Record<string, unknown>)['from'];
        const to = (dayValue as Record<string, unknown>)['to'];
        const start = typeof from === 'string' ? from : '';
        const end = typeof to === 'string' ? to : '';

        if (this.isValidTime(start) && this.isValidTime(end)) {
          day.enabled = true;
          day.start = start;
          day.end = end;
        }
      }
    }
  }

  private resetAvailability(): void {
    this.dayAvailability = this.weekdayConfig.map((day) => ({
      ...day,
      enabled: false,
      start: '09:00',
      end: '17:00',
    }));
  }

  private isValidTime(value: string): boolean {
    return /^\d{2}:\d{2}$/.test(value);
  }

  private buildTimeOptions(): string[] {
    const options: string[] = [];

    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        options.push(`${hh}:${mm}`);
      }
    }

    return options;
  }
}
