import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredPermissions: string[] = route.data?.['permissions'] ?? [];
  if (requiredPermissions.length > 0 && !authService.hasAnyPermission(requiredPermissions)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
