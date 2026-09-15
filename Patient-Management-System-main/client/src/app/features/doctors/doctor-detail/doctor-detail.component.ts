import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DoctorUser } from '../../../core/models/doctor.model';
import { DoctorService } from '../../../core/services/doctor.service';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-detail.component.html',
})
export class DoctorDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly doctorService = inject(DoctorService);
  private readonly location = inject(Location);
  private readonly weekdayOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  doctor: DoctorUser | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.doctorService.getDoctorById(id).subscribe({
      next: (response) => {
        this.doctor = response.data.user;
        this.loading = false;
      },
      error: () => {
        this.doctor = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get fullName(): string {
    if (!this.doctor) {
      return '-';
    }

    return `${this.doctor.first_name} ${this.doctor.last_name}`.trim();
  }

  get initials(): string {
    if (!this.doctor) {
      return '--';
    }

    const first = this.doctor.first_name?.charAt(0) || '';
    const last = this.doctor.last_name?.charAt(0) || '';

    return `${first}${last}`.toUpperCase();
  }

  get statusBadgeClass(): string {
    return this.doctor?.is_active ? 'badge-success' : 'badge-neutral';
  }

  get specialtyName(): string {
    return (
      this.doctor?.doctorProfile?.specialty?.specialty_name ||
      this.doctor?.doctorProfile?.specialty_id ||
      '-'
    );
  }

  get practiceLocationName(): string {
    return (
      this.doctor?.doctorProfile?.practiceLocation?.location_name ||
      this.doctor?.doctorProfile?.practice_location_id ||
      '-'
    );
  }

  get availabilityRows(): Array<{ dayLabel: string; slots: string[] }> {
    const schedule = this.doctor?.doctorProfile?.availability_schedule;

    if (!schedule || typeof schedule !== 'object') {
      return [];
    }

    const raw = schedule as Record<string, unknown>;
    const rows: Array<{ dayLabel: string; slots: string[] }> = [];

    this.weekdayOrder.forEach((day) => {
      const slots = this.normalizeDaySlots(raw[day]);
      if (slots.length) {
        rows.push({ dayLabel: this.toTitleCase(day), slots });
      }
    });

    Object.entries(raw)
      .filter(([key]) => !this.weekdayOrder.includes(key.toLowerCase()))
      .forEach(([key, value]) => {
        const slots = this.normalizeDaySlots(value);
        if (slots.length) {
          rows.push({ dayLabel: this.toTitleCase(key), slots });
        }
      });

    return rows;
  }

  get availabilityRawText(): string | null {
    const schedule = this.doctor?.doctorProfile?.availability_schedule;

    if (schedule === undefined || schedule === null || schedule === '') {
      return null;
    }

    if (typeof schedule === 'string') {
      return schedule;
    }

    if (typeof schedule === 'object' && this.availabilityRows.length === 0) {
      try {
        return JSON.stringify(schedule, null, 2);
      } catch {
        return null;
      }
    }

    return null;
  }

  private normalizeDaySlots(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.toSlotLabel(item))
        .filter((slot): slot is string => !!slot);
    }

    const slot = this.toSlotLabel(value);
    return slot ? [slot] : [];
  }

  private toSlotLabel(value: unknown): string | null {
    if (typeof value === 'string') {
      return this.formatSlotRange(value);
    }

    if (value && typeof value === 'object') {
      const candidate = value as Record<string, unknown>;
      const start = candidate['from'] ?? candidate['start'];
      const end = candidate['to'] ?? candidate['end'];

      if (typeof start === 'string' && typeof end === 'string') {
        return `${start} - ${end}`;
      }
    }

    return null;
  }

  private formatSlotRange(value: string): string {
    const compact = value.trim();
    const match = compact.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);

    if (!match) {
      return compact;
    }

    return `${match[1]} - ${match[2]}`;
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
