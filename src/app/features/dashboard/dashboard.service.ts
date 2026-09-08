import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  EmployeeDashboardResponse,
  ManagerDashboardResponse,
  ExecutiveDashboardResponse,
} from './models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiV1}/dashboard`;

  getEmployeeDashboard() {
    return this.http.get<EmployeeDashboardResponse>(`${this.base}/employee`);
  }

  getManagerDashboard(departmentId?: number) {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ManagerDashboardResponse>(`${this.base}/manager`, { params });
  }

  getExecutiveDashboard(year?: number, municipalityId?: number) {
    // Always send the current year — avoids NULL type inference issue in PostgreSQL
    // when the backend uses (? IS NULL OR review_year = ?) pattern
    let params = new HttpParams()
      .set('year', year ?? new Date().getFullYear());
    if (municipalityId) params = params.set('municipalityId', municipalityId);
    return this.http.get<ExecutiveDashboardResponse>(`${this.base}/executive`, { params });
  }

  getStatistics(year?: number, municipalityId?: number) {
    let params = new HttpParams()
      .set('year', year ?? new Date().getFullYear());
    if (municipalityId) params = params.set('municipalityId', municipalityId);
    return this.http.get<Record<string, unknown>>(`${this.base}/statistics`, { params });
  }
}

