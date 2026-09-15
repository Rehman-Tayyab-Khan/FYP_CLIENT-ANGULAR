import { Patient } from './patient.model';
import { PracticeLocation } from './practice-location.model';
import { Insurance } from './insurance.model';
import { Firm } from './firm.model';

export enum CaseCategory {
  GENERAL_MEDICINE = 'General Medicine',
  SURGERY = 'Surgery',
  PEDIATRICS = 'Pediatrics',
  CARDIOLOGY = 'Cardiology',
  ORTHOPEDICS = 'Orthopedics',
  NEUROLOGY = 'Neurology',
  DERMATOLOGY = 'Dermatology',
  GYNECOLOGY = 'Gynecology',
  OPHTHALMOLOGY = 'Ophthalmology',
  ENT = 'ENT',
  DENTAL = 'Dental',
  PSYCHIATRY = 'Psychiatry',
  PHYSICAL_THERAPY = 'Physical Therapy',
  EMERGENCY = 'Emergency',
  OTHER = 'Other',
}

export enum CaseType {
  INITIAL_CONSULTATION = 'Initial Consultation',
  FOLLOW_UP = 'Follow-up',
  EMERGENCY = 'Emergency',
  CHRONIC_CARE = 'Chronic Care',
  PREVENTIVE_CARE = 'Preventive Care',
  PRE_SURGICAL = 'Pre-surgical',
  POST_SURGICAL = 'Post-surgical',
}

export enum CasePriority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum CaseStatus {
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  CLOSED = 'Closed',
  TRANSFERRED = 'Transferred',
  CANCELLED = 'Cancelled',
}

export interface Case {
  id: string;
  case_number: string;
  patient_id: string;
  practice_location_id: string;
  category: CaseCategory;
  purpose_of_visit: string;
  case_type: CaseType;
  priority: CasePriority;
  case_status: CaseStatus;
  date_of_accident?: string | null;
  insurance_id?: string | null;
  firm_id?: string | null;
  referred_by?: string | null;
  referred_doctor_name?: string | null;
  opening_date: string;
  closing_date?: string | null;
  clinical_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  patient?: Patient;
  practiceLocation?: PracticeLocation;
  insurance?: Insurance;
  firm?: Firm;
}

export interface CreateCasePayload {
  patient_id: string;
  practice_location_id: string;
  category: CaseCategory;
  purpose_of_visit: string;
  case_type: CaseType;
  priority?: CasePriority;
  case_status?: CaseStatus;
  date_of_accident?: string;
  insurance_id?: string;
  firm_id?: string;
  referred_by?: string;
  referred_doctor_name?: string;
  opening_date?: string;
  closing_date?: string;
  clinical_notes?: string;
}

export type UpdateCasePayload = Partial<CreateCasePayload>;

export interface CaseFilters {
  page?: number;
  per_page?: number;
  search?: string;
  case_number?: string;
  patient_id?: string;
  practice_location_id?: string;
  case_status?: CaseStatus;
  priority?: CasePriority;
  category?: CaseCategory;
  case_type?: CaseType;
  insurance_id?: string;
  firm_id?: string;
  opening_date?: string;
  opening_date_from?: string;
  opening_date_to?: string;
}

export interface CreateCaseResponse {
  case: Case;
}
