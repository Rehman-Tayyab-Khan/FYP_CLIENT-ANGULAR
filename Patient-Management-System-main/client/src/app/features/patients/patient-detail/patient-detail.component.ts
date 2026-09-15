import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-detail.component.html',
})
export class PatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly location = inject(Location);

  patient: Patient | null = null;
  loading = true;

  readonly recentVisits = [
    { date: '2026-04-12', type: 'Follow-up', department: 'Cardiology' },
    { date: '2026-03-24', type: 'Initial Intake', department: 'General Care' },
    { date: '2026-02-11', type: 'Lab Review', department: 'Diagnostics' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    //INFO: Patient detail is loaded from API using route param so each clicked row opens its own profile.
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        this.patient = response.data.patient;
        this.loading = false;
      },
      error: () => {
        this.patient = null;
        this.loading = false;
      },
    });
  }

  get fullName(): string {
    if (!this.patient) {
      return 'Unknown Patient';
    }

    return [
      this.patient.first_name,
      this.patient.middle_name,
      this.patient.last_name,
    ]
      .filter(Boolean)
      .join(' ');
  }

  get age(): number {
    if (!this.patient) {
      return 0;
    }

    const birth = new Date(this.patient.date_of_birth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      years--;
    }
    return years;
  }

  get initials(): string {
    if (!this.patient) {
      return '--';
    }

    const first = this.patient.first_name?.charAt(0) || '';
    const last = this.patient.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  goBack(): void {
    this.location.back();
  }
}
