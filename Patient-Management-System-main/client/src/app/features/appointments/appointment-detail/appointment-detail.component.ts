import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.css'],
})
export class AppointmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentService = inject(AppointmentService);
  private readonly location = inject(Location);

  appointment: Appointment | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      return;
    }

    this.appointmentService.getAppointmentById(id).subscribe({
      next: (response) => {
        this.appointment = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.appointment = null;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  get patientName(): string {
    return this.appointment?.patient_name || '-';
  }

  get statusBadgeClass(): string {
    const value = this.appointment?.status?.toLowerCase();
    if (value === 'scheduled' || value === 'confirmed') return 'badge-info';
    if (value === 'checked in' || value === 'in progress')
      return 'badge-warning';
    if (value === 'completed') return 'badge-success';
    if (value === 'cancelled' || value === 'no show') return 'badge-error';
    if (value === 'rescheduled') return 'badge-neutral';
    return 'badge-ghost';
  }
}
