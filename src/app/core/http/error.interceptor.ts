import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Global HTTP error interceptor.
 * Translates status codes into user-friendly toast notifications.
 *
 * Rules:
 * - Auth endpoints: skipped (login component handles its own errors)
 * - Background GET endpoints (dashboard, reviews stats): silent 500s — they
 *   already have local fallbacks so no need to alarm the user with a sticky toast
 * - JDBC/SQL type errors (PostgreSQL null-type inference): shown as brief warning
 * - All other errors: shown as before
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  const isAuthEndpoint = req.url.includes('/auth/login') ||
                         req.url.includes('/auth/register') ||
                         req.url.includes('/auth/refresh');

  // Background read-only endpoints that have graceful local fallbacks
  const isBackgroundEndpoint =
    req.method === 'GET' && (
      req.url.includes('/dashboard/') ||
      req.url.includes('/reviews/year/') ||
      req.url.includes('/reviews/stats') ||
      req.url.includes('/performance/summary')
    );

  return next(req).pipe(
    catchError(err => {
      if (!isAuthEndpoint) {
        showToast(toast, err, req, isBackgroundEndpoint);
      }
      return throwError(() => err);
    })
  );
};

function showToast(
  toast: ToastService,
  err: any,
  req: any,
  isBackground: boolean
): void {
  const status: number = err.status ?? 0;

  const body   = err.error;
  const detail = body?.message ?? body?.error ?? body?.detail ?? null;

  // Detect PostgreSQL JDBC null-type inference error — backend needs CAST fix
  const isJdbcTypeError = typeof detail === 'string' && (
    detail.includes('JDBC exception') ||
    detail.includes('could not determine data type') ||
    detail.includes('JDBC')
  );

  // Background endpoints with local fallbacks: show brief info instead of sticky error
  if (isBackground && status === 500) {
    if (isJdbcTypeError) {
      // Don't even show a toast — the page handles it gracefully
      return;
    }
    toast.warning('Data load issue', 'Some dashboard data could not be loaded.', 4000);
    return;
  }

  // JDBC type errors on user-initiated actions: brief warning
  if (isJdbcTypeError) {
    toast.warning(
      'Database query error',
      'A server-side SQL parameter issue occurred. Please contact the backend team to fix CAST on nullable params.',
      6000
    );
    return;
  }

  switch (status) {
    case 0:
      toast.error(
        'No connection',
        'Cannot reach the server. Check your network or ensure the backend is running.',
        0
      );
      break;

    case 400:
      toast.warning(
        'Validation error',
        detail ?? 'One or more fields are invalid. Please check your input.'
      );
      break;

    case 401:
      break; // Handled by authInterceptor

    case 403:
      toast.error(
        'Access denied',
        detail ?? 'You do not have permission to perform this action.'
      );
      break;

    case 404:
      toast.info(
        'Not found',
        detail ?? 'The requested resource could not be found.'
      );
      break;

    case 409:
      toast.warning(
        'Conflict',
        detail ?? 'This action conflicts with the current state of the resource.'
      );
      break;

    case 422:
      toast.warning(
        'Business rule violation',
        detail ?? 'The request was understood but could not be processed.'
      );
      break;

    case 429:
      toast.warning(
        'Too many requests',
        'Please slow down — you are sending requests too quickly.',
        8000
      );
      break;

    case 500:
      toast.error(
        'Server error',
        detail ?? 'An unexpected error occurred on the server. Please try again or contact support.',
        0
      );
      break;

    case 502:
    case 503:
    case 504:
      toast.error(
        'Service unavailable',
        'The server is temporarily unavailable. Please try again in a moment.',
        0
      );
      break;

    default:
      if (status >= 400) {
        toast.error(
          `Request failed (${status})`,
          detail ?? 'An unexpected error occurred.'
        );
      }
  }
}



