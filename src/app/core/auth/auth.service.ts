import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse } from '../models/auth.model';
import { User } from '../models/user.model';

const TOKEN_KEY         = 'kpi_auth_token';
const REFRESH_TOKEN_KEY = 'kpi_refresh_token';
const USER_KEY          = 'kpi_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = () => !!this._token() && !this.isTokenExpired();

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiV1}/auth/login`, credentials).pipe(
      tap(response => {
        // ── Normalise token ─────────────────────────────────────────────
        const token = response.token ?? response.accessToken ?? response.jwt ?? '';

        // ── Extract roles from all possible sources ──────────────────────
        // 1. Decode JWT payload — Spring Security often embeds roles/authorities there
        let jwtRoles: string[] = [];
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            // Handle array-of-strings: ["ROLE_ADMIN"]
            if (Array.isArray(payload.roles)) {
              jwtRoles = payload.roles.map((r: any) =>
                typeof r === 'string' ? r : r?.authority ?? ''
              ).filter(Boolean);
            }
            // Handle Spring Security authorities: [{authority:"ROLE_ADMIN"}]
            if (!jwtRoles.length && Array.isArray(payload.authorities)) {
              jwtRoles = payload.authorities.map((a: any) =>
                typeof a === 'string' ? a : a?.authority ?? ''
              ).filter(Boolean);
            }
            // Some backends use "scope" or "scp"
            if (!jwtRoles.length && payload.scope) {
              jwtRoles = String(payload.scope).split(' ').filter(Boolean);
            }
          }
        } catch { /* ignore decode errors */ }

        // 2. Normalise authorities from response body
        const bodyAuthorities: string[] = Array.isArray(response.authorities)
          ? response.authorities.map((a: any) =>
              typeof a === 'string' ? a : a?.authority ?? ''
            ).filter(Boolean)
          : [];

        // 3. Merge: response.roles > bodyAuthorities > jwtRoles (first non-empty wins)
        const resolvedRoles: string[] =
          (response.user?.roles?.length   ? response.user.roles   : null) ??
          (response.roles?.length         ? response.roles         : null) ??
          (bodyAuthorities.length         ? bodyAuthorities        : null) ??
          jwtRoles;

        // ── Normalise user ──────────────────────────────────────────────
        const fullName = response.user?.fullName
          ?? response.fullName
          ?? ((response.firstName ?? '') + ' ' + (response.lastName ?? '')).trim()
          ?? response.user?.username
          ?? response.username
          ?? '';

        const user: User = response.user
          ? { ...response.user, fullName: response.user.fullName || fullName, roles: resolvedRoles,
              employeeId: response.user.employeeId ?? response.employeeId }
          : {
              // Use explicit id; fall back to employeeId if no separate userId in response
              id:          response.id ?? response.employeeId ?? 0,
              username:    response.username ?? response.email ?? '',
              email:       response.email       ?? '',
              fullName,
              roles:       resolvedRoles,
              permissions: response.permissions ?? [],
              employeeId:  response.employeeId,
            };

        this._token.set(token);
        this._currentUser.set(user);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        // Store refresh token if provided
        if (response.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Clear session data without navigating — used by the interceptor */
  clearSession(): void {
    this._token.set(null);
    this._currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return this._token();
  }

  /**
   * Role → implied permissions mapping.
   * Handles both ROLE_MANAGER and MANAGER formats returned by the backend.
   */
  private readonly roleImpliedPermissions: Record<string, string[]> = {
    ROLE_ADMIN:             ['ADMIN','KPI_MANAGE','KPI_REVIEW','KPI_SUBMIT','REPORT_VIEW'],
    ADMIN:                  ['ADMIN','KPI_MANAGE','KPI_REVIEW','KPI_SUBMIT','REPORT_VIEW'],
    ROLE_MUNICIPAL_MANAGER: ['KPI_REVIEW','REPORT_VIEW','KPI_MANAGE'],
    MUNICIPAL_MANAGER:      ['KPI_REVIEW','REPORT_VIEW','KPI_MANAGE'],
    ROLE_DIRECTOR:          ['KPI_REVIEW','REPORT_VIEW'],
    DIRECTOR:               ['KPI_REVIEW','REPORT_VIEW'],
    ROLE_MANAGER:           ['KPI_REVIEW','KPI_SUBMIT','REPORT_VIEW'],
    MANAGER:                ['KPI_REVIEW','KPI_SUBMIT','REPORT_VIEW'],
    ROLE_HR:                ['KPI_REVIEW','KPI_MANAGE','REPORT_VIEW'],
    HR:                     ['KPI_REVIEW','KPI_MANAGE','REPORT_VIEW'],
    ROLE_EMPLOYEE:          ['KPI_SUBMIT','REPORT_VIEW'],
    EMPLOYEE:               ['KPI_SUBMIT','REPORT_VIEW'],
    // Generic user roles — grant basic KPI_SUBMIT access
    ROLE_USER:              ['KPI_SUBMIT','REPORT_VIEW'],
    USER:                   ['KPI_SUBMIT','REPORT_VIEW'],
  };

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    // 1. Direct match in permissions[]
    if (user.permissions.includes(permission)) return true;
    // 2. Permission implied by a role the user holds
    if ((user.roles ?? []).some(role => {
      const implied = this.roleImpliedPermissions[role] ?? [];
      return implied.includes(permission);
    })) return true;
    // 3. If the user has NO roles at all AND no specific permissions,
    //    treat as a basic employee (KPI_SUBMIT, REPORT_VIEW only)
    const hasNoRoles = !user.roles?.length;
    const hasNoPerms = !user.permissions?.length;
    if (hasNoRoles && hasNoPerms) {
      return ['KPI_SUBMIT', 'REPORT_VIEW'].includes(permission);
    }
    return false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      // exp is seconds since epoch; if no exp claim, treat token as valid
      if (!payload.exp) return false;
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
