import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import {
  AdminSection, FinancialYear, PerformanceCycle,
  RatingScale, SystemConfig, NotificationTemplate, PublicHoliday,
} from '../../models/admin.model';

@Component({
  selector: 'app-admin-centre',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-centre.html',
  styleUrl: './admin-centre.css',
})
export class AdminCentre implements OnInit {
  private adminSvc = inject(AdminService);

  activeTab = signal<AdminSection>('financial-years');

  // ── Data ────────────────────────────────────────────────
  financialYears = signal<FinancialYear[]>([]);
  cycles         = signal<PerformanceCycle[]>([]);
  ratingScales   = signal<RatingScale[]>([]);
  config         = signal<SystemConfig | null>(null);
  templates      = signal<NotificationTemplate[]>([]);
  holidays       = signal<PublicHoliday[]>([]);

  /** ID of the first working calendar — needed for holiday CRUD */
  activeCalendarId = signal<number | null>(null);

  isLoading   = signal(false);
  isSaving    = signal(false);
  error       = signal<string | null>(null);
  saveSuccess = signal<string | null>(null);

  // ── Form state ───────────────────────────────────────────
  fyForm:     Partial<FinancialYear>     = {};
  cycleForm:  Partial<PerformanceCycle>  = {};
  configForm: Partial<SystemConfig>      = {};
  holidayForm: Partial<PublicHoliday>    = {};

  editingFY:    FinancialYear | null    = null;
  editingCycle: PerformanceCycle | null = null;
  editingScale: RatingScale | null      = null;

  readonly tabs: { key: AdminSection; label: string; icon: string }[] = [
    { key: 'financial-years',        label: 'Financial Years',        icon: 'calendar_today'  },
    { key: 'performance-cycles',     label: 'Performance Cycles',     icon: 'loop'            },
    { key: 'rating-scales',          label: 'Rating Scales',          icon: 'star_rate'       },
    { key: 'system-config',          label: 'System Config',          icon: 'settings'        },
    { key: 'notification-templates', label: 'Notification Templates', icon: 'email'           },
    { key: 'working-calendar',       label: 'Working Calendar',       icon: 'event_available' },
  ];

  ngOnInit(): void { this.loadTab(); }

  selectTab(tab: AdminSection): void {
    this.activeTab.set(tab);
    this.error.set(null);
    this.saveSuccess.set(null);
    this.loadTab();
  }

  private loadTab(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const done = () => this.isLoading.set(false);
    const fail = (err: any) => { this.error.set(`Load failed (HTTP ${err.status}).`); done(); };

    switch (this.activeTab()) {
      case 'financial-years':
        this.adminSvc.getFinancialYears().subscribe({ next: d => { this.financialYears.set(d); done(); }, error: fail });
        break;
      case 'performance-cycles':
        this.adminSvc.getCycles().subscribe({ next: d => { this.cycles.set(d); done(); }, error: fail });
        break;
      case 'rating-scales':
        this.adminSvc.getRatingScales().subscribe({ next: d => { this.ratingScales.set(d); done(); }, error: fail });
        break;
      case 'system-config':
        // Config API returns grouped key-value pairs; show an update-only form with blank defaults
        this.config.set({} as SystemConfig);
        done();
        break;
      case 'notification-templates':
        this.adminSvc.getTemplates().subscribe({ next: d => { this.templates.set(d); done(); }, error: fail });
        break;
      case 'working-calendar':
        // Load calendars first to get an ID, then fetch holidays for the first calendar
        this.adminSvc.getCalendars().subscribe({
          next: cals => {
            const first = (cals ?? [])[0] as any;
            if (first?.id) {
              this.activeCalendarId.set(first.id as number);
              this.adminSvc.getHolidays(first.id as number).subscribe({
                next: h => { this.holidays.set(h); done(); },
                error: fail,
              });
            } else {
              done();
            }
          },
          error: fail,
        });
        break;
    }
  }

  // ── Financial Years ─────────────────────────────────────
  startEditFY(fy: FinancialYear): void  { this.editingFY = { ...fy }; this.fyForm = { ...fy }; }
  cancelEditFY(): void                  { this.editingFY = null; this.fyForm = {}; }
  saveFY(): void {
    this.isSaving.set(true);
    const obs$ = this.editingFY?.id
      ? this.adminSvc.updateFinancialYear(this.editingFY.id, this.fyForm)
      : this.adminSvc.createFinancialYear(this.fyForm);
    obs$.subscribe({
      next: () => { this.isSaving.set(false); this.cancelEditFY(); this.loadTab(); this.saveSuccess.set('Saved.'); },
      error: err => { this.isSaving.set(false); this.error.set(`Save failed (HTTP ${err.status}).`); },
    });
  }
  deleteFY(id?: number): void {
    if (!id || !confirm('Delete this financial year?')) return;
    this.adminSvc.deleteFinancialYear(id).subscribe({
      next: () => this.loadTab(),
      error: err => this.error.set(`Delete failed (HTTP ${err.status}).`),
    });
  }

  // ── Performance Cycles ──────────────────────────────────
  startEditCycle(c: PerformanceCycle): void { this.editingCycle = { ...c }; this.cycleForm = { ...c }; }
  cancelEditCycle(): void                   { this.editingCycle = null; this.cycleForm = {}; }
  saveCycle(): void {
    this.isSaving.set(true);
    const obs$ = this.editingCycle?.id
      ? this.adminSvc.updateCycle(this.editingCycle.id, this.cycleForm)
      : this.adminSvc.createCycle(this.cycleForm);
    obs$.subscribe({
      next: () => { this.isSaving.set(false); this.cancelEditCycle(); this.loadTab(); this.saveSuccess.set('Saved.'); },
      error: err => { this.isSaving.set(false); this.error.set(`Save failed (HTTP ${err.status}).`); },
    });
  }
  /** Closes (not deletes) a cycle — the API has no DELETE endpoint for cycles */
  deleteCycle(id?: number): void {
    if (!id || !confirm('Close this cycle? This action cannot be undone.')) return;
    this.adminSvc.closeCycle(id).subscribe({
      next: () => this.loadTab(),
      error: err => this.error.set(`Failed (HTTP ${err.status}).`),
    });
  }

  // ── Rating Scales ────────────────────────────────────────
  startEditScale(s: RatingScale): void { this.editingScale = { ...s }; }
  cancelEditScale(): void              { this.editingScale = null; }
  saveScale(): void {
    if (!this.editingScale?.id) return;
    this.isSaving.set(true);
    this.adminSvc.updateRatingScale(this.editingScale.id, this.editingScale).subscribe({
      next: () => { this.isSaving.set(false); this.cancelEditScale(); this.loadTab(); this.saveSuccess.set('Scale saved.'); },
      error: err => { this.isSaving.set(false); this.error.set(`Save failed (HTTP ${err.status}).`); },
    });
  }

  // ── System Config ────────────────────────────────────────
  saveConfig(): void {
    const f = this.configForm as any;
    const entries: Array<{ configKey: string; configValue: string; dataType: string; category: string }> = [];
    if (f.municipalityName     != null) entries.push({ configKey: 'municipality.name',              configValue: String(f.municipalityName),      dataType: 'STRING',  category: 'GENERAL'  });
    if (f.maxEvidenceFileSizeMb != null) entries.push({ configKey: 'evidence.max_size_mb',           configValue: String(f.maxEvidenceFileSizeMb), dataType: 'INTEGER', category: 'EVIDENCE' });
    if (f.reviewReminderDays   != null) entries.push({ configKey: 'review.reminder_days',           configValue: String(f.reviewReminderDays),    dataType: 'INTEGER', category: 'REVIEW'   });
    if (f.escalationAfterDays  != null) entries.push({ configKey: 'review.escalation_days',         configValue: String(f.escalationAfterDays),   dataType: 'INTEGER', category: 'REVIEW'   });
    if (f.sessionTimeoutMinutes != null) entries.push({ configKey: 'auth.session_timeout_minutes',  configValue: String(f.sessionTimeoutMinutes),  dataType: 'INTEGER', category: 'AUTH'     });
    if (!entries.length) { this.saveSuccess.set('Nothing to save.'); return; }
    this.isSaving.set(true);
    this.adminSvc.bulkUpdateConfig(entries).subscribe({
      next: () => { this.isSaving.set(false); this.saveSuccess.set('Configuration saved.'); },
      error: err => { this.isSaving.set(false); this.error.set(`Save failed (HTTP ${err.status}).`); },
    });
  }

  // ── Working Calendar ─────────────────────────────────────
  addHoliday(): void {
    const calId = this.activeCalendarId();
    if (!calId || !this.holidayForm.name || !this.holidayForm.date) return;
    const payload: Partial<PublicHoliday> = {
      name:        this.holidayForm.name,
      holidayDate: this.holidayForm.date,
      type:        this.holidayForm.type ?? 'PUBLIC_HOLIDAY',
      recurring:   this.holidayForm.recurring ?? false,
    };
    this.adminSvc.addHoliday(calId, payload).subscribe({
      next: () => { this.holidayForm = {}; this.loadTab(); this.saveSuccess.set('Holiday added.'); },
      error: err => this.error.set(`Failed (HTTP ${err.status}).`),
    });
  }
  deleteHoliday(id?: number): void {
    const calId = this.activeCalendarId();
    if (!id || !calId || !confirm('Remove this holiday?')) return;
    this.adminSvc.deleteHoliday(calId, id).subscribe({
      next: () => this.loadTab(),
      error: err => this.error.set(`Delete failed (HTTP ${err.status}).`),
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  statusBadge(s?: string): string {
    const map: Record<string, string> = { ACTIVE: 'badge-active', CLOSED: 'badge-gray', FUTURE: 'badge-blue', OPEN: 'badge-active', DRAFT: 'badge-warning', PLANNED: 'badge-blue', ARCHIVED: 'badge-gray' };
    return map[s ?? ''] ?? 'badge-gray';
  }
}
