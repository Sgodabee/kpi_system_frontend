import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeService }      from '../../../../core/services/employee.service';
import { KpiAssignmentService } from '../../../../core/services/kpi-assignment.service';
import { PerformanceService }   from '../../../performance/services/performance.service';
import { ReviewService }        from '../../../reviews/services/review.service';
import { Employee }             from '../../../../core/models/employee.model';
import { KpiAssignment }        from '../../../../core/models/kpi-assignment.model';
import { PerformanceRecord }    from '../../../performance/models/performance-record.model';
import { PerformanceReview }    from '../../../reviews/models/performance-review';

export interface KpiRow {
  kpiCode:        string;
  kpiName:        string;
  unit:           string;
  target:         number;
  actual:         number | null;
  achievementPct: number | null;
  score:          number | null;
  weight:         number;
  status:         string;
}

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass],
  templateUrl: './report-preview.html',
  styleUrl: './report-preview.css',
})
export class ReportPreview implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private empSvc    = inject(EmployeeService);
  private assignSvc = inject(KpiAssignmentService);
  private perfSvc   = inject(PerformanceService);
  private reviewSvc = inject(ReviewService);

  isLoading   = signal(true);
  error       = signal<string | null>(null);
  employee    = signal<Employee | null>(null);
  kpiRows     = signal<KpiRow[]>([]);
  review      = signal<PerformanceReview | null>(null);
  generatedAt = new Date();

  reportType    = 'EMPLOYEE_PERFORMANCE';
  financialYear = '';
  period        = '';
  reportYear    = new Date().getFullYear();

  ngOnInit(): void {
    const p = this.route.snapshot.queryParams;
    const employeeId   = p['employeeId']   ? +p['employeeId']   : null;
    this.reportType    = p['type']          ?? 'EMPLOYEE_PERFORMANCE';
    this.financialYear = p['financialYear'] ?? `${this.reportYear}-${this.reportYear + 1}`;
    this.period        = p['period']        ?? '';
    this.reportYear    = p['year']          ? +p['year'] : new Date().getFullYear();

    if (!employeeId) {
      this.error.set('No employee selected. Go back and choose an employee from the Parameters section.');
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      employee:    this.empSvc.getById(employeeId),
      assignments: this.assignSvc.getAll({ assigneeType: 'EMPLOYEE', assigneeId: employeeId, status: 'ACTIVE' })
                     .pipe(catchError(() => of([]))),
      records:     this.perfSvc.getAll({ employeeId, year: this.reportYear, size: 200 })
                     .pipe(catchError(() => of([]))),
      reviews:     this.reviewSvc.getByEmployee(employeeId)
                     .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ employee, assignments, records, reviews }) => {
        this.employee.set(employee);
        // Most recent review for this year
        const yr = this.reportYear;
        const found = (reviews as PerformanceReview[]).find(r =>
          r.submittedAt?.startsWith(String(yr))
        ) ?? (reviews as PerformanceReview[])[0] ?? null;
        this.review.set(found);
        this.kpiRows.set(this.buildKpiRows(assignments as KpiAssignment[], records as PerformanceRecord[]));
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(`Failed to load report data (HTTP ${err.status}).`);
        this.isLoading.set(false);
      }
    });
  }

  private buildKpiRows(assignments: KpiAssignment[], records: PerformanceRecord[]): KpiRow[] {
    return assignments.map(a => {
      const record = records.find(r => r.assignmentId === a.id);
      return {
        kpiCode:        a.kpiDefinitionCode ?? a.kpiCode ?? '—',
        kpiName:        a.kpiDefinitionName ?? a.kpiName ?? '—',
        unit:           a.unit ?? '',
        target:         a.targetValue ?? 0,
        actual:         record?.actualValue ?? null,
        achievementPct: record?.achievementPct ?? null,
        score:          record?.score ?? null,
        weight:         a.weight ?? 0,
        status:         record?.status ?? 'NOT_SUBMITTED',
      };
    });
  }

  get overallScore(): number | null {
    if (this.review()?.overallScore != null) return this.review()!.overallScore!;
    return this.calcWeightedScore();
  }

  private calcWeightedScore(): number | null {
    const rows = this.kpiRows().filter(r => r.score != null);
    if (!rows.length) return null;
    const totalW = rows.reduce((s, r) => s + (r.weight || 1), 0);
    const weighted = rows.reduce((s, r) => s + (r.score! * (r.weight || 1)), 0);
    return Math.round((weighted / totalW) * 100) / 100;
  }

  get ratingLabel(): string {
    const r = this.review();
    if (r) {
      // Try to get rating from backend status
      const step = (r as any).status ?? '';
      if (step === 'FINALISED' || step === 'APPROVED') {
        // Use overallScore to derive label
      }
    }
    return this.scoreToRating(this.overallScore);
  }

  private scoreToRating(s: number | null): string {
    if (s == null) return '—';
    if (s >= 4.5) return 'Outstanding';
    if (s >= 3.5) return 'Exceeds Expectations';
    if (s >= 2.5) return 'Meets Expectations';
    if (s >= 1.5) return 'Needs Improvement';
    return 'Unacceptable';
  }

  get ratingClass(): string {
    const s = this.overallScore;
    if (s == null) return '';
    if (s >= 4.5) return 'r-outstanding';
    if (s >= 3.5) return 'r-exceeds';
    if (s >= 2.5) return 'r-meets';
    if (s >= 1.5) return 'r-needs';
    return 'r-unacceptable';
  }

  get scorePercent(): number {
    const s = this.overallScore;
    if (s == null) return 0;
    return Math.min(100, (s / 5) * 100);
  }

  achColor(pct: number | null): string {
    if (pct == null) return '#94a3b8';
    if (pct >= 100) return '#059669';
    if (pct >= 75)  return '#2563eb';
    if (pct >= 50)  return '#d97706';
    return '#dc2626';
  }

  achCapped(pct: number | null): number {
    return Math.min(100, pct ?? 0);
  }

  statusLabel(s: string): string {
    return s.replace(/_/g, ' ');
  }

  statusClass(s: string): string {
    return {
      SUBMITTED:          'st-submitted',
      APPROVED:           'st-approved',
      DRAFT:              'st-draft',
      REJECTED:           'st-rejected',
      NOT_SUBMITTED:      'st-none',
      REVIEWED:           'st-reviewed',
      REVISION_REQUESTED: 'st-revision',
    }[s] ?? 'st-none';
  }

  get empInitials(): string {
    const e = this.employee();
    if (!e) return '?';
    return `${e.firstName?.charAt(0) ?? ''}${e.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  get totalWeight(): number {
    return this.kpiRows().reduce((s, r) => s + (r.weight || 0), 0);
  }

  get completedKpis(): number {
    return this.kpiRows().filter(r => r.actual != null).length;
  }

  printReport(): void { window.print(); }
  goBack(): void { this.router.navigate(['/reports']); }
}

