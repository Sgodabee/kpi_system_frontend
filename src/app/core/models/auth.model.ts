import { User } from './user.model';

export interface LoginRequest {
  email:    string;
  password: string;
}

/**
 * Flexible AuthResponse — handles the most common Spring Boot JWT response shapes:
 *
 * Shape A (nested user):
 *   { token, tokenType, expiresIn, user: { id, username, email, roles, permissions } }
 *
 * Shape B (flat / Spring Security JwtUtils style):
 *   { token, type, id, username, email, roles }
 *
 * Shape C (accessToken alias):
 *   { accessToken, tokenType, ... }
 */
export interface AuthResponse {
  // Token fields
  token?:         string;
  accessToken?:   string;
  jwt?:           string;
  refreshToken?:  string;   // returned by backend for token refresh

  tokenType?: string;
  type?:      string;
  expiresIn?: number;

  // Nested user object (Shape A)
  user?: User;

  // Flat / inline user fields (Shape B — matches backend response)
  id?:          number;
  username?:    string;
  email?:       string;
  fullName?:    string;
  firstName?:   string;
  lastName?:    string;
  roles?:       string[];
  permissions?: string[];
  employeeId?:  number;   // HR employee record ID

  // Spring Security authorities format: [{authority: 'ROLE_ADMIN'}]
  authorities?: Array<{ authority: string } | string>;
}

export type { User } from './user.model';
