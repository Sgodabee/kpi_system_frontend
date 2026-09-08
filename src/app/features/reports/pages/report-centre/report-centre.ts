import {
  Component, OnInit, OnDestroy, inject, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { ReportService } from '../../services/report.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import {
  ReportType, ReportFormat, ReportExecution,
  REPORT_TYPES, ReportTypeOption, ReportParameters,
} from '../../models/report.model';
import { Department } from '../../../../core/models/department.model';
import { Employee } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-report-centre',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './report-centre.html',
  styleUrl: './report-centre.css',
})
export class ReportCentre implements OnInit, OnDestroy {
  private reportSvc = inject(ReportService);
  private deptSvc   = inject(DepartmentService);
  private empSvc    = inject(EmployeeService);
  private router    = inject(Router);

  selectedType    = signal<ReportType>('EMPLOYEE_PERFORMANCE');
  selectedFormat  = signal<ReportFormat>('PDF');
  params: ReportParameters = {};

  departments   = signal<Department[]>([]);
  employees     = signal<Employee[]>([]);
  isGenerating  = signal(false);
  generateError = signal<string | null>(null);
  generateSuccess = signal<string | null>(null);

  executions    = signal<ReportExecution[]>([]);
  isLoadingExec = signal(true);
  execError     = signal<string | null>(null);

  private pollSub: Subscription | null = null;

  readonly reportTypes = REPORT_TYPES;
  readonly formats: ReportFormat[] = ['PDF', 'EXCEL', 'CSV'];

  selectedTypeMeta = computed<ReportTypeOption>(() =>
    REPORT_TYPES.find(t => t.value === this.selectedType())!
  );

  get showDeptParam():   boolean { return this.selectedTypeMeta().params.includes('departmentId'); }
  get showEmpParam():    boolean { return this.selectedTypeMeta().params.includes('employeeId'); }
  get showPeriodParam(): boolean { return this.selectedTypeMeta().params.includes('period'); }
  get showFYParam():     boolean { return this.selectedTypeMeta().params.includes('financialYear'); }
  get showCycleParam():  boolean { return this.selectedTypeMeta().params.includes('cycleId'); }

  get periodOptions(): { value: string; label: string }[] {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      opts.push({ value: val, label: d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) });
    }
    return opts;
  }

  get fyOptions(): string[] {
    const y = new Date().getFullYear();
    return [`${y}-${y + 1}`, `${y - 1}-${y}`, `${y - 2}-${y - 1}`];
  }

  ngOnInit(): void {
    this.deptSvc.getAll().subscribe({ next: d => this.departments.set(d.content ?? []), error: () => {} });
    this.empSvc.getAll({ size: 200 }).subscribe({ next: p => this.employees.set(p.content), error: () => {} });
    this.startPolling();
  }

  ngOnDestroy(): void { this.pollSub?.unsubscribe(); }

  private startPolling(): void {
    this.pollSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.reportSvc.getExecutions({ size: 20 })),
    ).subscribe({
      next: execs => {
        this.executions.set(execs);
        this.isLoadingExec.set(false);
        this.execError.set(null);
      },
      error: err => {
        this.isLoadingExec.set(false);
        this.execError.set(err.status === 0 ? 'Cannot connect to server.' : `Failed to load (HTTP ${err.status}).`);
      },
    });
  }

  generate(): void {
    this.isGenerating.set(true);
    this.generateError.set(null);
    this.generateSuccess.set(null);

    this.reportSvc.generate({
      reportType: this.selectedType(),
      format: this.selectedFormat(),
      filter: { ...this.params },
    }).subscribe({
      next: res => {
        this.isGenerating.set(false);
        const id = res.id ?? res.executionId ?? '—';
        this.generateSuccess.set(`Report queued (ID: ${id}). It will appear in Recent Reports when ready.`);
        this.params = {};
      },
      error: err => {
        this.isGenerating.set(false);
        this.generateError.set(err.error?.message ?? `Generation failed (HTTP ${err.status}).`);
      },
    });
  }

  selectType(type: ReportType): void {
    this.selectedType.set(type);
    this.params = {};
    this.generateSuccess.set(null);
    this.generateError.set(null);
  }

  previewReport(): void {
    const queryParams: Record<string, string | number> = {
      type: this.selectedType(),
    };
    if (this.params.employeeId)   queryParams['employeeId']   = this.params.employeeId;
    if (this.params.departmentId) queryParams['departmentId'] = this.params.departmentId;
    if (this.params.financialYear)queryParams['financialYear']= this.params.financialYear;
    if (this.params.period)       queryParams['period']       = this.params.period;
    if (this.params.cycleId)      queryParams['cycleId']      = this.params.cycleId;
    const year = this.params.period?.split('-')[0] ?? new Date().getFullYear();
    queryParams['year'] = year;
    this.router.navigate(['/reports/preview'], { queryParams });
  }

  formatIcon(fmt: ReportFormat): string {
    return { PDF: 'picture_as_pdf', EXCEL: 'table_chart', CSV: 'description' }[fmt] ?? 'description';
  }

  statusIcon(s: string): string {
    return { COMPLETED: 'check_circle', PENDING: 'pending', FAILED: 'error' }[s] ?? 'help';
  }

  statusClass(s: string): string {
    return { COMPLETED: 'status-completed', PENDING: 'status-pending', FAILED: 'status-failed' }[s] ?? '';
  }

  statusLabel(s: string): string {
    return { COMPLETED: 'Ready', PENDING: 'Processing', FAILED: 'Failed' }[s] ?? s;
  }

  getDisplayName(ex: ReportExecution): string {
    return ex.reportName ?? ex.reportDefinitionName
      ?? REPORT_TYPES.find(t => t.value === ex.reportType)?.label
      ?? ex.reportType;
  }

  getDownloadUrl(ex: ReportExecution): string {
    return ex.downloadUrl ?? this.reportSvc.downloadUrl(ex.id);
  }

  formatDate(iso?: string): string {
    const s = iso;
    if (!s) return '—';
    try { return new Date(s).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
  }

  getRequestedAt(ex: ReportExecution): string {
    return this.formatDate(ex.requestedAt ?? ex.createdAt);
  }

  hasProcessing(): boolean {
    return this.executions().some(e => e.status === 'PENDING');
  }
}
