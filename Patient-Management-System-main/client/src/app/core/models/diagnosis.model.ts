export interface Diagnosis {
  id: string;
  icd_code: string;
  diagnoses_name: string;
  description?: string | null;
  is_active: boolean;
}

export interface DiagnosisFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}
