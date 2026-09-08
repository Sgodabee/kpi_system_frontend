import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuditEvent, AuditFilter } from '../models/audit-event.model';
import { Page } from '../../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiV1}/audit`;

  /**
   * Paginated audit event log.
   * Maps to: GET /api/v1/audit
   */
  getEvents(filter: AuditFilter = {}) {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 20);
    if (filter.userId)   params = params.set('userId',   filter.userId);
    if (filter.action)   params = params.set('action',   filter.action);
    if (filter.module)   params = params.set('module',   filter.module);
    if (filter.entityId) params = params.set('entityId', filter.entityId);
    if (filter.search)   params = params.set('search',   filter.search);
    if (filter.from)     params = params.set('from',     filter.from);
    if (filter.to)       params = params.set('to',       filter.to);
    if (filter.sort)     params = params.set('sort', `${filter.sort},${filter.direction ?? 'desc'}`);
    return this.http.get<Page<AuditEvent>>(this.base, { params });
  }

  /**
   * Single audit event with full before/after snapshots.
   * Maps to: GET /api/v1/audit/{id}
   */
  getById(id: string) {
    return this.http.get<AuditEvent>(`${this.base}/${id}`);
  }

  /**
   * Build the CSV/Excel export URL.
   * Maps to: GET /api/v1/audit/export?format=CSV
   */
  exportUrl(filter: AuditFilter, format: 'CSV' | 'EXCEL'): string {
    let params = new HttpParams().set('format', format);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.module) params = params.set('module', filter.module);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.from)   params = params.set('from', filter.from);
    if (filter.to)     params = params.set('to', filter.to);
    return `${this.base}/export?${params.toString()}`;
  }
}

