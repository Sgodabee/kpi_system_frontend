import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Division, DivisionRequest } from '../models/division.model';

@Injectable({ providedIn: 'root' })
export class DivisionService {
  private http = inject(HttpClient);
  private base = `${environment.apiV1}/divisions`;

  /** GET /api/v1/divisions?departmentId= */
  getAll(departmentId?: number) {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<Division[]>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<Division>(`${this.base}/${id}`);
  }

  create(data: DivisionRequest) {
    return this.http.post<Division>(this.base, data);
  }

  update(id: number, data: Partial<DivisionRequest>) {
    return this.http.put<Division>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
