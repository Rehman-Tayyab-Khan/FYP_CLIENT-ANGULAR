import { Request } from "express";
import { PaginationLinks, PaginationMeta } from "../types";

export interface PaginatedResult<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export function getPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  req: Request,
): PaginatedResult<T> {
  const last_page = Math.ceil(total / limit) || 1;
  const current_page = Math.min(page, last_page);

  const from = total === 0 ? null : (current_page - 1) * limit + 1;
  const to = total === 0 ? null : Math.min(current_page * limit, total);

  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost";
  const baseUrl = `${protocol}://${host}${req.originalUrl.split("?")[0]}`;

  const buildUrl = (p: number) => {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "page") {
        url.searchParams.set(key, String(value));
      }
    }
    url.searchParams.set("page", p.toString());
    return url.toString();
  };

  const first = buildUrl(1);
  const last = buildUrl(last_page);
  const prev = current_page > 1 ? buildUrl(current_page - 1) : null;
  const next = current_page < last_page ? buildUrl(current_page + 1) : null;
  const links: PaginationLinks = {
    first,
    last,
    prev,
    next,
  };

  const pageLinks: PaginationMeta["links"] = [];
  pageLinks.push({
    url: prev,
    label: "&laquo; Previous",
    page: current_page > 1 ? current_page - 1 : null,
    active: false,
  });

  for (let i = 1; i <= last_page; i++) {
    pageLinks.push({
      url: buildUrl(i),
      label: i.toString(),
      page: i,
      active: i === current_page,
    });
  }

  pageLinks.push({
    url: next,
    label: "Next &raquo;",
    page: current_page < last_page ? current_page + 1 : null,
    active: false,
  });

  return {
    data,
    links,
    meta: {
      current_page,
      from,
      last_page,
      links: pageLinks,
      path: baseUrl,
      per_page: limit,
      to,
      total,
    },
  };
}
