import {
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { inject } from '@angular/core';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  return next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as ApiResponse<unknown>;
        if (body.message && !(body.message == ''))
          toastService.success(body.message);
        console.log(body.message, body.data);
      }
      return event;
    }),
    catchError((error: any) => {
      const message = error?.error?.message || error?.message || 'Something went wrong';
      // console.log("error", error.error.message);

      if (!error?.error?.message.includes("Access token")) {
        toastService.error(message);
      }

      console.error(message);
      return throwError(() => error);
    }),
  );
};
