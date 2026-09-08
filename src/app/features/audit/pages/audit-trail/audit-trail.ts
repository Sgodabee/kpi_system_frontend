import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/audit.service';
import { AuditEvent, AuditFilter, AuditAction, AuditModule } from '../../models/audit-event.model';
import { Page } from '../../../../core/models/page.model';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './audit-trail.html',
  styleUrl: './audit-trail.css',
})
export class AuditTrail implements OnInit {
  private auditSvc = inject(AuditService);

  page      = signal<Page<AuditEvent> | null>(null);
  selected  = signal<AuditEvent | null>(null);
  isLoading = signal(true);
  isLoadingDetail = signal(false);
  error     = signal<string | null>(null);

  // ── Filter state ─────────────────────────────────────────
  searchText = '';
  filterAction: AuditAction | '' = '';
  filterModule: AuditModule | '' = '';
  filterFrom = '';
  filterTo   = '';
  currentPage = 0;

  get events(): AuditEvent[] { return this.page()?.content ?? []; }
  get total():  number       { return this.page()?.totalElements ?? 0; }
  get totalPages(): number   { return this.page()?.totalPages ?? 0; }

  readonly actions: AuditAction[] = ['CREATE','UPDATE','DELETE','APPROVE','REJECT','SUBMIT','REVISION_REQUESTED','LOGIN','LOGOUT','LOCK'];
  readonly modules: AuditModule[] = ['KPI','PERFORMANCE','REVIEW','EMPLOYEE','DEPARTMENT','ADMIN','AUTH'];

  ngOnInit(): void { this.load(); }

  load(page = 0): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage = page;

    const filter: AuditFilter = {
      page,
      size: 20,
      sort: 'timestamp',
      direction: 'desc',
    };
    if (this.searchText.trim())  filter.search = this.searchText.trim();
    if (this.filterAction)       filter.action = this.filterAction;
    if (this.filterModule)       filter.module = this.filterModule;
    if (this.filterFrom)         filter.from   = this.filterFrom;
    if (this.filterTo)           filter.to     = this.filterTo;

    this.auditSvc.getEvents(filter).subscribe({
      next:  p  => { this.page.set(p);  this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 0 ? 'Cannot connect to server.' : `Failed to load (HTTP ${err.status}).`);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.searchText = (e.target as HTMLInputElement).value;
    this.load();
  }

  clearFilters(): void {
    this.searchText   = '';
    this.filterAction = '';
    this.filterModule = '';
    this.filterFrom   = '';
    this.filterTo     = '';
    this.load();
  }

  selectEvent(ev: AuditEvent): void {
    // If detail endpoint is separate, fetch full detail; otherwise use list item
    this.selected.set(ev);
    if (!ev.beforeSnapshot && !ev.afterSnapshot) {
      this.isLoadingDetail.set(true);
      this.auditSvc.getById(ev.id).subscribe({
        next:  full => { this.selected.set(full); this.isLoadingDetail.set(false); },
        error: ()   => this.isLoadingDetail.set(false),
      });
    }
  }

  closeDetail(): void { this.selected.set(null); }

  exportCSV(): void  { window.open(this.auditSvc.exportUrl(this.buildFilter(), 'CSV'),  '_blank'); }
  exportExcel(): void { window.open(this.auditSvc.exportUrl(this.buildFilter(), 'EXCEL'), '_blank'); }

  private buildFilter(): AuditFilter {
    const f: AuditFilter = {};
    if (this.searchText)   f.search = this.searchText;
    if (this.filterAction) f.action = this.filterAction;
    if (this.filterModule) f.module = this.filterModule;
    if (this.filterFrom)   f.from   = this.filterFrom;
    if (this.filterTo)     f.to     = this.filterTo;
    return f;
  }

  actionClass(a: string): string {
    const map: Record<string, string> = {
      CREATE: 'act-create', UPDATE: 'act-update', DELETE: 'act-delete',
      APPROVE: 'act-approve', REJECT: 'act-reject', SUBMIT: 'act-submit',
      REVISION_REQUESTED: 'act-revision', LOGIN: 'act-info', LOGOUT: 'act-info', LOCK: 'act-lock',
    };
    return map[a] ?? '';
  }

  formatDateTime(iso: string): string {
    try { return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  snapshotEntries(snap?: Record<string, unknown>): { key: string; value: string }[] {
    if (!snap) return [];
    return Object.entries(snap).map(([key, value]) => ({
      key,
      value: value == null ? '—' : JSON.stringify(value),
    }));
  }

  pages(): number[] {
    const t = this.totalPages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i);
    const cur = this.currentPage;
    const pages = new Set([0, t - 1, cur, cur - 1, cur + 1].filter(p => p >= 0 && p < t));
    return [...pages].sort((a, b) => a - b);
  }
}

