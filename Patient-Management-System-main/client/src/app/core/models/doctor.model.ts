import { PracticeLocation } from './practice-location.model';
import { Specialty } from './specialty.model';

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty_id: string;
  practice_location_id: string;
  email: string;
  license_number: string;
  availability_schedule?: unknown;
  bio?: string | null;
  specialty?: Specialty;
  practiceLocation?: PracticeLocation;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorUser {
  id: string;
  role: 'doctor';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  doctorProfile?: DoctorProfile | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  specialty_id?: string;
  practice_location_id?: string;
}

export interface CreateDoctorPayload {
  role: 'doctor';
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  is_active: boolean;
  specialty_id: string;
  practice_location_id: string;
  license_number: string;
  bio?: string;
  availability_schedule?: unknown;
}

export interface UpdateDoctorPayload {
  role?: 'doctor';
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
  is_active?: boolean;
  specialty_id?: string;
  practice_location_id?: string;
  license_number?: string;
  bio?: string;
  availability_schedule?: unknown;
}
