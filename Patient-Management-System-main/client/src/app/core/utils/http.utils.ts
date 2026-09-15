import { HttpParams } from '@angular/common/http';


export function createHttpParams(filters: Record<string, any> = {}): HttpParams {
  let params = new HttpParams();

  Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

  return params;
}
