export type VisitStatus = 'Draft' | 'Completed' | 'Cancelled' | 'Billed';

export interface Visit {
  id: string;
  visit_number: string;
  appointment_id: string;
  appointment_number?: string;
  case_id: string;
  case_number?: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  visit_date: string;
  visit_time?: string | null;
  visit_duration_minutes?: number | null;
  diagnoses_id?: string | null;
  diagnoses_name?: string | null;
  diagnoses_icd_code?: string | null;
  diagnoses_description?: string | null;
  diagnoses_is_active?: boolean;
  treatment?: string | null;
  treatment_plan?: string | null;
  prescription?: string | null;
  prescription_documents?: string[] | null;
  notes?: string | null;
  vital_signs?: Record<string, unknown> | null;
  symptoms?: string | null;
  follow_up_required: boolean;
  follow_up_date?: string | null;
  referral_made: boolean;
  referral_to?: string | null;
  visit_status: VisitStatus;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VisitFilters {
  page?: number;
  per_page?: number;
  search?: string;
  visit_status?: VisitStatus;
  case_id?: string;
  patient_id?: string;
  doctor_id?: string;
  date_from?: string;
  date_to?: string;
}

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

export interface UpdateVisitPayload {
  visit_date?: string;
  visit_time?: string;
  visit_duration_minutes?: number;
  diagnoses_id?: string | null;
  diagnosis_icd_code?: string;
  diagnosis_description?: string;
  diagnosis_is_active?: boolean;
  treatment?: string;
  treatment_plan?: string;
  prescription?: string;
  prescription_documents?: string[];
  notes?: string;
  vital_signs?: Record<string, unknown>;
  symptoms?: string;
  follow_up_required?: boolean;
  follow_up_date?: string | null;
  referral_made?: boolean;
  referral_to?: string | null;
  visit_status?: VisitStatus;
}
