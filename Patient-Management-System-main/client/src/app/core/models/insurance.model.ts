export interface InsurancePrimaryAddress {
  id: string;
  address: string;
  phone?: string | null;
  is_primary: boolean;
}

export interface InsuranceAddressPayload {
  id?: string;
  address: string;
  phone: string;
  is_primary: boolean;
}

export interface Insurance {
  id: string;
  insurance_name: string;
  insurance_code: string;
  is_active: boolean;
  primary_address?: InsurancePrimaryAddress | null;
  addresses?: InsurancePrimaryAddress[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateInsurancePayload {
  insurance_name: string;
  insurance_code: string;
  addresses: InsuranceAddressPayload[];
  // Backward-compatible fields used by older API handlers.
  address: string;
  phone: string;
  is_active?: boolean;
}

export type UpdateInsurancePayload = Partial<CreateInsurancePayload>;

export interface InsuranceFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}
