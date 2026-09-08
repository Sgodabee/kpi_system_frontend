import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  FinancialYear, PerformanceCycle,
  RatingScale, SystemConfig,
  NotificationTemplate, PublicHoliday,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiV1}/admin`;

  // ── Financial Years ────────────────────────────────────────────────────────
  /** GET /api/v1/admin/financial-years */
  getFinancialYears() { return this.http.get<FinancialYear[]>(`${this.base}/financial-years`); }
  /** GET /api/v1/admin/financial-years/active */
  getActiveFinancialYear() { return this.http.get<FinancialYear>(`${this.base}/financial-years/active`); }
  createFinancialYear(d: Partial<FinancialYear>) { return this.http.post<FinancialYear>(`${this.base}/financial-years`, d); }
  updateFinancialYear(id: number, d: Partial<FinancialYear>) { return this.http.put<FinancialYear>(`${this.base}/financial-years/${id}`, d); }
  deleteFinancialYear(id: number) { return this.http.delete<void>(`${this.base}/financial-years/${id}`); }
  /** PATCH /api/v1/admin/financial-years/{id}/activate */
  activateFinancialYear(id: number) { return this.http.patch<FinancialYear>(`${this.base}/financial-years/${id}/activate`, null); }
  /** PATCH /api/v1/admin/financial-years/{id}/lock */
  lockFinancialYear(id: number) { return this.http.patch<FinancialYear>(`${this.base}/financial-years/${id}/lock`, null); }

  // ── Performance Cycles ─────────────────────────────────────────────────────
  /** GET /api/v1/admin/cycles */
  getCycles(financialYearId?: number) {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PerformanceCycle[]>(`${this.base}/cycles`, { params });
  }
  /** GET /api/v1/admin/cycles/current */
  getCurrentCycle() { return this.http.get<PerformanceCycle>(`${this.base}/cycles/current`); }
  createCycle(d: Partial<PerformanceCycle>) { return this.http.post<PerformanceCycle>(`${this.base}/cycles`, d); }
  updateCycle(id: number, d: Partial<PerformanceCycle>) { return this.http.put<PerformanceCycle>(`${this.base}/cycles/${id}`, d); }
  /** PATCH /api/v1/admin/cycles/{id}/activate */
  activateCycle(id: number) { return this.http.patch<PerformanceCycle>(`${this.base}/cycles/${id}/activate`, null); }
  /** PATCH /api/v1/admin/cycles/{id}/close */
  closeCycle(id: number) { return this.http.patch<PerformanceCycle>(`${this.base}/cycles/${id}/close`, null); }

  // ── Rating Scales ──────────────────────────────────────────────────────────
  /** GET /api/v1/admin/rating-scales */
  getRatingScales() { return this.http.get<RatingScale[]>(`${this.base}/rating-scales`); }
  /** GET /api/v1/admin/rating-scales/default */
  getDefaultRatingScale() { return this.http.get<RatingScale>(`${this.base}/rating-scales/default`); }
  createRatingScale(d: Partial<RatingScale>) { return this.http.post<RatingScale>(`${this.base}/rating-scales`, d); }
  updateRatingScale(id: number, d: Partial<RatingScale>) { return this.http.put<RatingScale>(`${this.base}/rating-scales/${id}`, d); }
  deleteRatingScale(id: number) { return this.http.delete<void>(`${this.base}/rating-scales/${id}`); }
  /** PATCH /api/v1/admin/rating-scales/{id}/set-default */
  setDefaultRatingScale(id: number) { return this.http.patch<RatingScale>(`${this.base}/rating-scales/${id}/set-default`, null); }

  // ── Performance Cycles (extra) ────────────────────────────────────────────
  /** DELETE /api/v1/admin/cycles/{id} (falls back to close if API doesn't support it) */
  deleteCycle(id: number) { return this.http.delete<void>(`${this.base}/cycles/${id}`); }

  // ── System Config ──────────────────────────────────────────────────────────
  /** GET /api/v1/admin/config — grouped by category */
  getConfig() { return this.http.get<Record<string, SystemConfig[]>>(`${this.base}/config`); }
  getConfigByCategory(category: string) { return this.http.get<SystemConfig[]>(`${this.base}/config/category/${category}`); }
  getConfigByKey(key: string) { return this.http.get<SystemConfig>(`${this.base}/config/${key}`); }
  updateConfig(key: string, d: Partial<SystemConfig>) { return this.http.put<SystemConfig>(`${this.base}/config/${key}`, d); }
  /** POST /api/v1/admin/config/bulk */
  bulkUpdateConfig(entries: Array<{ configKey: string; configValue: string; dataType?: string; category?: string }>) {
    return this.http.post<SystemConfig[]>(`${this.base}/config/bulk`, entries);
  }

  // ── Notification Templates ─────────────────────────────────────────────────
  /** GET /api/v1/admin/notification-templates */
  getTemplates() { return this.http.get<NotificationTemplate[]>(`${this.base}/notification-templates`); }
  createTemplate(d: Partial<NotificationTemplate>) { return this.http.post<NotificationTemplate>(`${this.base}/notification-templates`, d); }
  updateTemplate(id: number, d: Partial<NotificationTemplate>) { return this.http.put<NotificationTemplate>(`${this.base}/notification-templates/${id}`, d); }
  deleteTemplate(id: number) { return this.http.delete<void>(`${this.base}/notification-templates/${id}`); }
  /** PATCH /api/v1/admin/notification-templates/{id}/activate */
  activateTemplate(id: number) { return this.http.patch<NotificationTemplate>(`${this.base}/notification-templates/${id}/activate`, null); }
  /** PATCH /api/v1/admin/notification-templates/{id}/deactivate */
  deactivateTemplate(id: number) { return this.http.patch<NotificationTemplate>(`${this.base}/notification-templates/${id}/deactivate`, null); }

  // ── Working Calendar / Holidays ────────────────────────────────────────────
  /** GET /api/v1/admin/calendars */
  getCalendars() { return this.http.get<any[]>(`${this.base}/calendars`); }
  /** GET /api/v1/admin/calendars/{id}/holidays */
  getHolidays(calendarId: number) { return this.http.get<PublicHoliday[]>(`${this.base}/calendars/${calendarId}/holidays`); }
  addHoliday(calendarId: number, d: Partial<PublicHoliday>) { return this.http.post<PublicHoliday>(`${this.base}/calendars/${calendarId}/holidays`, d); }
  deleteHoliday(calendarId: number, holidayId: number) { return this.http.delete<void>(`${this.base}/calendars/${calendarId}/holidays/${holidayId}`); }
}
