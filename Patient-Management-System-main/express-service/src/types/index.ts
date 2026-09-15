export {};

declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      userRole?: string;
      user?: import("../models/user.model").User;
    }
  }
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}
interface MetaLinks {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}
interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path: string;
  links: MetaLinks[];
}

export { PaginationLinks, PaginationMeta };
