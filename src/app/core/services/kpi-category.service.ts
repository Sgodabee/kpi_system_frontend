import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { KpiCategory } from '../models/kpi.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class KpiCategoryService {
  private http = inject(HttpClient);
  /** API base: /api/v1/kpi/categories */
  private base = `${environment.apiV1}/kpi/categories`;

  getAll(page = 0, size = 100) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<KpiCategory>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<KpiCategory>(`${this.base}/${id}`);
  }

  create(data: Partial<KpiCategory>) {
    return this.http.post<KpiCategory>(this.base, data);
  }

  update(id: number, data: Partial<KpiCategory>) {
    return this.http.put<KpiCategory>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
