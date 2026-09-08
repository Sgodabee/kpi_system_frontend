import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Employee, EmployeeFilter, EmployeeRequest } from '../models/employee.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = `${environment.apiV1}/employees`;

  /** GET /api/v1/employees?positionId=&divisionId=&departmentId=&municipalityId=&pageable= */
  getAll(filter: EmployeeFilter = {}) {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 20);
    if (filter.positionId)    params = params.set('positionId',    filter.positionId);
    if (filter.departmentId)  params = params.set('departmentId',  filter.departmentId);
    if (filter.divisionId)    params = params.set('divisionId',    filter.divisionId);
    if (filter.municipalityId)params = params.set('municipalityId',filter.municipalityId);
    if (filter.sort)          params = params.set('sort', `${filter.sort},${filter.direction ?? 'asc'}`);

    return this.http.get<Page<Employee>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<Employee>(`${this.base}/${id}`);
  }

  create(data: EmployeeRequest) {
    return this.http.post<Employee>(this.base, data);
  }

  update(id: number, data: Partial<EmployeeRequest>) {
    return this.http.put<Employee>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
