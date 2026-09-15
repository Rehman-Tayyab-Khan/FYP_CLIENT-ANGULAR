export interface Specialty {
  id: string;
  specialty_name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSpecialtyPayload {
  specialty_name: string;
  description?: string;
  is_active?: boolean;
}

export type UpdateSpecialtyPayload = Partial<CreateSpecialtyPayload>;

export interface SpecialtyFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}
