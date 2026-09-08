import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { KpiAssignment, AssignmentFilter, AssignmentRequest } from '../models/kpi-assignment.model';

@Injectable({ providedIn: 'root' })
export class KpiAssignmentService {
  private http = inject(HttpClient);
  /** API base: /api/v1/kpi/assignments */
  private base = `${environment.apiV1}/kpi/assignments`;

  getAll(filter: AssignmentFilter = {}) {
    let params = new HttpParams();
    if (filter.assigneeType)  params = params.set('assigneeType',  filter.assigneeType);
    if (filter.assigneeId)    params = params.set('assigneeId',    filter.assigneeId);
    if (filter.employeeId)    params = params.set('assigneeId',    filter.employeeId);
    if (filter.departmentId)  params = params.set('departmentId',  filter.departmentId);
    if (filter.year)          params = params.set('year',          filter.year);
    if (filter.status)        params = params.set('status',        filter.status);
    if (filter.kpiId)         params = params.set('kpiId',         filter.kpiId);
    return this.http.get<KpiAssignment[]>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<KpiAssignment>(`${this.base}/${id}`);
  }

  create(data: AssignmentRequest) {
    return this.http.post<KpiAssignment>(this.base, data);
  }

  update(id: number, data: Partial<AssignmentRequest>) {
    return this.http.put<KpiAssignment>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** PATCH /api/v1/kpi/assignments/{id}/activate */
  activate(id: number) {
    return this.http.patch<KpiAssignment>(`${this.base}/${id}/activate`, null);
  }

  /** Mark complete via PUT status=COMPLETED (no dedicated /complete endpoint) */
  complete(id: number, existing: KpiAssignment) {
    const body: Partial<AssignmentRequest> = {
      kpiDefinitionId: existing.kpiDefinitionId!,
      assigneeType:    existing.assigneeType!,
      assigneeId:      existing.assigneeId!,
      periodYear:      existing.periodYear!,
      periodNumber:    existing.periodNumber!,
      targetValue:     existing.targetValue!,
      weight:          existing.weight,
      periodType:      existing.periodType,
      status:          'COMPLETED',
    };
    return this.http.put<KpiAssignment>(`${this.base}/${id}`, body);
  }

  /** PATCH /api/v1/kpi/assignments/{id}/cancel */
  cancel(id: number) {
    return this.http.patch<KpiAssignment>(`${this.base}/${id}/cancel`, null);
  }
}
