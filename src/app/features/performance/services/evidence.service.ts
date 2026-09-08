import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PerformanceEvidence } from '../models/performance-evidence.model';

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private http = inject(HttpClient);
  /** Sub-path under a performance record: /performance/{id}/evidences */
  private recordBase = (id: number) => `${environment.apiV1}/performance/${id}/evidences`;

  /** GET /api/v1/performance/{performanceId}/evidences */
  getByRecord(recordId: number) {
    return this.http.get<PerformanceEvidence[]>(this.recordBase(recordId));
  }

  /**
   * POST /api/v1/performance/{performanceId}/evidences
   * Query params: description, uploadedById
   */
  upload(
    recordId: number,
    file: File,
    uploadedById?: number,
    description?: string,
    onProgress: (pct: number) => void = () => {}
  ): Observable<PerformanceEvidence> {
    const fd = new FormData();
    fd.append('file', file, file.name);

    let params = new HttpParams();
    if (uploadedById) params = params.set('uploadedById', uploadedById);
    if (description)  params = params.set('description',  description);

    const req = new HttpRequest('POST', this.recordBase(recordId), fd, {
      reportProgress: true,
      params,
    });

    return this.http.request<PerformanceEvidence>(req).pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          onProgress(Math.round(100 * event.loaded / event.total));
        }
      }),
      filter(event => event.type === HttpEventType.Response),
      map(event => (event as any).body as PerformanceEvidence)
    );
  }

  /** GET /api/v1/evidence/{id}/download */
  download(evidenceId: number, fileName: string): void {
    this.http
      .get(`${environment.apiV1}/evidence/${evidenceId}/download`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  /** DELETE /api/v1/evidence/{id} */
  delete(evidenceId: number) {
    return this.http.delete<void>(`${environment.apiV1}/evidence/${evidenceId}`);
  }

  /** GET /api/v1/evidence/{id} */
  getById(evidenceId: number) {
    return this.http.get<PerformanceEvidence>(`${environment.apiV1}/evidence/${evidenceId}`);
  }
}
