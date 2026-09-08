import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const token       = authService.getToken();

  // Attach Bearer token to every request (except login itself)
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      // Only intercept 401 on protected routes — NEVER on the auth endpoint itself.
      // Intercepting a login 401 would call logout() → navigate('/login') before
      // the login component's own error handler can show the message.
      const isAuthEndpoint = req.url.includes('/auth/login') ||
                             req.url.includes('/auth/register') ||
                             req.url.includes('/auth/refresh');

      if (err.status === 401 && !isAuthEndpoint) {
        authService.clearSession();   // clear storage only — navigate separately
        router.navigate(['/login']);
      }

      // Always re-throw so the originating component can handle it
      return throwError(() => err);
    })
  );
};
