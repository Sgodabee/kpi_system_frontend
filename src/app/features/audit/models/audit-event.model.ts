export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'APPROVE' | 'REJECT' | 'SUBMIT' | 'REVISION_REQUESTED'
  | 'LOGIN' | 'LOGOUT' | 'LOCK';

export type AuditModule =
  | 'KPI' | 'PERFORMANCE' | 'REVIEW' | 'EMPLOYEE'
  | 'DEPARTMENT' | 'ADMIN' | 'AUTH';

export interface AuditEvent {
  id: string;
  userId?: number;
  userName: string;
  userRole?: string;
  action: AuditAction;
  module: AuditModule;
  entityType?: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  sessionId?: string;
  timestamp: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
}

export interface AuditFilter {
  page?: number;
  size?: number;
  userId?: number;
  action?: AuditAction | string;
  module?: AuditModule | string;
  entityId?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

