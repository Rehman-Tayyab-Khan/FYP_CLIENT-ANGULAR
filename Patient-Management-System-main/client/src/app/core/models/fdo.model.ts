export interface FdoUser {
  id: string;
  role: 'fdo';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  userPermissions?: FdoUserPermission[];
  created_at?: string;
  updated_at?: string;
}

export interface FdoPermissionOption {
  id: string;
  permission_name: string;
  description?: string | null;
}

export interface FdoUserPermission {
  id: string;
  permission_id: string;
  permission?: FdoPermissionOption;
}

export interface FdoFilters {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

export interface UpdateFdoPayload {
  role?: 'fdo';
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  is_active?: boolean;
  password?: string;
  permissions?: string[];
}

export interface CreateFdoPayload {
  role: 'fdo';
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  is_active: boolean;
  permissions: string[];
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
