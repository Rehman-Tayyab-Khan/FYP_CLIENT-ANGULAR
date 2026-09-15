export interface PracticeLocation {
  id: string;
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePracticeLocationPayload {
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  is_active?: boolean;
}

export type UpdatePracticeLocationPayload =
  Partial<CreatePracticeLocationPayload>;

export interface PracticeLocationFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}
