import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Department, DepartmentRequest } from '../models/department.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private http = inject(HttpClient);
  private base = `${environment.apiV1}/departments`;

  /** GET /api/v1/departments?municipalityId=&pageable= */
  getAll(municipalityId?: number, page = 0, size = 100) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (municipalityId) params = params.set('municipalityId', municipalityId);
    return this.http.get<Page<Department>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<Department>(`${this.base}/${id}`);
  }

  create(data: DepartmentRequest) {
    return this.http.post<Department>(this.base, data);
  }

  update(id: number, data: Partial<DepartmentRequest>) {
    return this.http.put<Department>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
