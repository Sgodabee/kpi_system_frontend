import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PerformanceRecord, PerformanceFilter, PerformanceRequest
} from '../models/performance-record.model';
import { Page } from '../../../core/models/page.model';

/** Normalise: API may return a plain array OR a Spring Page object */
function toArray<T>(res: T[] | Page<T>): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return (res as Page<T>).content ?? [];
}

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private http = inject(HttpClient);
  readonly base = `${environment.apiV1}/performance`;

  /** GET /api/v1/performance — filterable list */
  getAll(filter: PerformanceFilter = {}) {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 20);
    if (filter.assigneeId)   params = params.set('assigneeId',   filter.assigneeId);
    if (filter.assigneeType) params = params.set('assigneeType', filter.assigneeType);
    if (filter.employeeId)   params = params.set('employeeId',   filter.employeeId);
    if (filter.departmentId) params = params.set('departmentId', filter.departmentId);
    if (filter.year)         params = params.set('year',         filter.year);
    if (filter.status)       params = params.set('status',       filter.status);
    if (filter.period)       params = params.set('period',       filter.period);
    if (filter.financialYear)params = params.set('financialYear', filter.financialYear);
    return this.http.get<PerformanceRecord[] | Page<PerformanceRecord>>(this.base, { params })
      .pipe(map(toArray));
  }

  /** GET /api/v1/performance/my — current employee's own records */
  getMyPerformance(filter: PerformanceFilter = {}) {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 200);
    if (filter.period)       params = params.set('period',       filter.period);
    if (filter.status)       params = params.set('status',       filter.status);
    if (filter.financialYear)params = params.set('financialYear', filter.financialYear);
    return this.http.get<PerformanceRecord[] | Page<PerformanceRecord>>(`${this.base}/my`, { params })
      .pipe(map(toArray));
  }

  getById(id: number) {
    return this.http.get<PerformanceRecord>(`${this.base}/${id}`);
  }

  create(data: PerformanceRequest) {
    return this.http.post<PerformanceRecord>(this.base, data);
  }

  update(id: number, data: Partial<PerformanceRequest>) {
    return this.http.put<PerformanceRecord>(`${this.base}/${id}`, data);
  }

  /** PATCH /api/v1/performance/{id}/submit?submittedById={userId} */
  submit(id: number, submittedById: number) {
    const params = new HttpParams().set('submittedById', submittedById);
    return this.http.patch<PerformanceRecord>(`${this.base}/${id}/submit`, null, { params });
  }

  /** PATCH /api/v1/performance/{id}/review */
  review(id: number, reviewedById: number, reviewNotes?: string) {
    return this.http.patch<PerformanceRecord>(`${this.base}/${id}/review`, { reviewedById, reviewNotes });
  }

  /** PATCH /api/v1/performance/{id}/approve */
  approve(id: number, reviewedById: number, reviewNotes?: string) {
    return this.http.patch<PerformanceRecord>(`${this.base}/${id}/approve`, { reviewedById, reviewNotes });
  }

  /** PATCH /api/v1/performance/{id}/reject */
  reject(id: number, reviewedById: number, reviewNotes: string) {
    return this.http.patch<PerformanceRecord>(`${this.base}/${id}/reject`, { reviewedById, reviewNotes });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
