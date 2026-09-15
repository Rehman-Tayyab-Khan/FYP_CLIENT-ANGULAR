export enum FirmType {
  LEGAL = 'legal',
  CORPORATE = 'corporate',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

export interface Firm {
  id: string;
  firm_name: string;
  firm_type: FirmType;
  address: string;
  contact_person: string;
  email?: string;
  phone: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FirmFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

export interface CreateFirmPayload {
  firm_name: string;
  firm_type: FirmType;
  address: string;
  contact_person: string;
  email?: string;
  phone: string;
  is_active?: boolean;
}

export interface UpdateFirmPayload extends Partial<CreateFirmPayload> {}
