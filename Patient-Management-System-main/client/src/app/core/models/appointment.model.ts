export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'No Show'
  | 'Rescheduled';

export type AppointmentType =
  | 'New Patient'
  | 'Follow-up'
  | 'Consultation'
  | 'Procedure'
  | 'Telehealth'
  | 'Emergency'
  | 'Routine Checkup'
  | 'Post-op Follow-up';

export type ReminderMethod = 'email' | 'sms' | 'phone' | 'none';

export interface Appointment {
  id: string;
  appointment_number: string;
  case_id: string;
  case_number?: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  appointment_type: AppointmentType;
  specialty_id: string;
  specialty_name?: string;
  practice_location_id: string;
  practice_location_name?: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reminder_sent: boolean;
  reminder_method?: ReminderMethod;
  notes?: string | null;
  reason_for_visit: string;
  created_by: string;
  created_by_name?: string;
  visit_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

//INFO: Payload for creating an appointment
export interface CreateAppointmentPayload {
  case_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  specialty_id: string;
  practice_location_id: string;
  duration_minutes?: number;
  reminder_method?: ReminderMethod;
  notes?: string;
  reason_for_visit: string;
}

//INFO: Payload for updating an appointment (all fields are optional)
export type UpdateAppointmentPayload = Partial<CreateAppointmentPayload> & {
  status?: AppointmentStatus;
};

//INFO: Filters for appointment list
export interface AppointmentFilters {
  page?: number;
  per_page?: number;
  patient_name?: string;
  doctor_name?: string;
  specialty_id?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  practice_location_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

//INFO: Standard paginated response structure from backend
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface CreateAppointmentResponse {
  appointment: Appointment;
}

export interface CompleteAppointmentPayload {
  diagnoses_id?: string;
  diagnosis_icd_code?: string;
  diagnosis_description?: string;
  diagnosis_is_active?: boolean;
  visit_duration_minutes?: number;
  symptoms: string;
  treatment: string;
  treatment_plan?: string;
  prescription: string;
  notes: string;
  follow_up_required?: boolean;
  follow_up_date?: string | null;
  referral_made?: boolean;
  referral_to?: string | null;
}
