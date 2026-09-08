import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Position {
  id:             number;
  name:           string;
  code?:          string;
  gradeLevel?:    string;
  divisionId?:    number;
  divisionName?:  string;
  departmentId?:  number;
  departmentName?: string;
  enabled?:       boolean;
}

export interface PositionRequest {
  name:        string;
  code:        string;
  divisionId:  number;
  description?: string;
  gradeLevel?: string;
  enabled?:    boolean;
}

@Injectable({ providedIn: 'root' })
export class PositionService {
  private http = inject(HttpClient);
  private base = `${environment.apiV1}/positions`;

  getAll(divisionId?: number) {
    let params = new HttpParams();
    if (divisionId) params = params.set('divisionId', divisionId);
    return this.http.get<Position[]>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<Position>(`${this.base}/${id}`);
  }

  create(data: PositionRequest) {
    return this.http.post<Position>(this.base, data);
  }

  update(id: number, data: Partial<PositionRequest>) {
    return this.http.put<Position>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
