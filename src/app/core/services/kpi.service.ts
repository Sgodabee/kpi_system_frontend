import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Kpi, KpiFilter, KpiRequest } from '../models/kpi.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private http = inject(HttpClient);
  /** API base: /api/v1/kpi/definitions */
  private base = `${environment.apiV1}/kpi/definitions`;

  getAll(filter: KpiFilter = {}) {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 20);
    if (filter.search)     params = params.set('search', filter.search);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter.type)       params = params.set('type', filter.type);
    if (filter.status)     params = params.set('status', filter.status);
    if (filter.sort)       params = params.set('sort', `${filter.sort},${filter.direction ?? 'asc'}`);
    return this.http.get<Page<Kpi>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<Kpi>(`${this.base}/${id}`);
  }

  create(data: KpiRequest) {
    return this.http.post<Kpi>(this.base, data);
  }

  update(id: number, data: Partial<KpiRequest>) {
    return this.http.put<Kpi>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
