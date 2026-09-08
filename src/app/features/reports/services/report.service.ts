import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ReportRequest, ReportGenerateResponse,
  ReportExecution, ReportFilter,
} from '../models/report.model';

interface ReportListResponse {
  items?:         ReportExecution[];
  content?:       ReportExecution[];
  totalElements?: number;
  totalPages?:    number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiV1}/reports`;

  /** POST /api/v1/reports/generate */
  generate(request: ReportRequest): Observable<ReportGenerateResponse> {
    return this.http.post<ReportGenerateResponse>(`${this.base}/generate`, request);
  }

  /** GET /api/v1/reports/history (falls back to /executions) */
  getExecutions(filter: ReportFilter = {}): Observable<ReportExecution[]> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 20);
    if (filter.status) params = params.set('status', filter.status);

    return this.http.get<ReportListResponse | ReportExecution[]>(`${this.base}/history`, { params }).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return (res as ReportListResponse).items ?? (res as ReportListResponse).content ?? [];
      }),
      catchError(() =>
        // Fallback to /executions if /history doesn't exist
        this.http.get<ReportListResponse | ReportExecution[]>(`${this.base}/executions`, { params }).pipe(
          map(res => {
            if (Array.isArray(res)) return res;
            return (res as ReportListResponse).items ?? (res as ReportListResponse).content ?? [];
          }),
          catchError(() => of([]))
        )
      )
    );
  }

  /** GET /api/v1/reports/executions/{id} */
  getExecution(id: string): Observable<ReportExecution> {
    return this.http.get<ReportExecution>(`${this.base}/executions/${id}`);
  }

  /** Build download URL for a completed report */
  downloadUrl(id: string): string {
    return `${this.base}/executions/${id}/download`;
  }

  /** Alternative download: /api/v1/reports/download/{id} */
  downloadAlt(id: string): string {
    return `${this.base}/download/${id}`;
  }
}
