import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService }         from '../../core/auth/auth.service';
import { DashboardService }    from './dashboard.service';
import { DepartmentService }   from '../../core/services/department.service';
import { DivisionService }     from '../../core/services/division.service';
import { EmployeeService }     from '../../core/services/employee.service';
import { KpiService }          from '../../core/services/kpi.service';
import { PerformanceService }  from '../performance/services/performance.service';
import { ReviewService }       from '../reviews/services/review.service';
import {
  EmployeeDashboardResponse,
  ManagerDashboardResponse,
  ExecutiveDashboardResponse,
  TopPerformerDto,
  RiskHeatMapDto,
  DepartmentSummaryDto,
} from './models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TitleCasePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService   = inject(AuthService);
  private dashboardSvc  = inject(DashboardService);
  private deptService   = inject(DepartmentService);
  private divisionSvc   = inject(DivisionService);
  private empService    = inject(EmployeeService);
  private kpiService    = inject(KpiService);
  private perfService   = inject(PerformanceService);
  private reviewService = inject(ReviewService);

  currentUser = this.authService.currentUser;

  // ── Raw API signals ────────────────────────────────────────────────────────
  private _empData  = signal<EmployeeDashboardResponse | null>(null);
  private _mgrData  = signal<ManagerDashboardResponse  | null>(null);
  private _execData = signal<ExecutiveDashboardResponse | null>(null);

  // ── Live counts loaded directly from individual endpoints ─────────────────
  private _deptCount      = signal(0);
  private _empCount       = signal(0);
  private _activeKpiCount = signal(0);
  private _pendingCount   = signal(0);
  private _overdueCount   = signal(0);
  private _computedScore  = signal(0);   // avg score from all perf records

  // ── Live dept performance built from real departments + performance data ───
  private _liveDeptPerf = signal<{ name: string; score: number; trend: string; color: string }[]>([]);

  isLoading = signal(true);

  // ── Employee dashboard ─────────────────────────────────────────────────────
  get dataLoaded():    boolean { return this._empData() !== null || this._mgrData() !== null || this._execData() !== null; }
  get totalKpis():     number  { return this._empData()?.myKpiCount    ?? 0; }
  get submittedKpis(): number  { return this._empData()?.submittedKpis ?? 0; }
  get pendingKpis():   number  { return this._empData()?.pendingKpis   ?? 0; }
  get overallScore():  number  { return this._empData()?.currentScore  ?? 0; }

  // ── Manager dashboard ──────────────────────────────────────────────────────
  get teamScore():      number { return Math.round((this._mgrData()?.teamAverageScore ?? 0) * 10) / 10; }
  get pendingReviews(): number {
    // Prefer live count loaded independently
    if (this._pendingCount() > 0) return this._pendingCount();
    const mgr  = this._mgrData();
    const exec = this._execData();
    if (mgr)  return mgr.pendingReviews?.length ?? 0;
    if (exec) return exec.pendingApprovals ?? 0;
    return 0;
  }
  get overdueReviews(): number {
    if (this._overdueCount() > 0) return this._overdueCount();
    const mgr  = this._mgrData();
    const exec = this._execData();
    if (mgr)  return mgr.overdueReviewCount ?? 0;
    if (exec) return exec.lateSubmissions   ?? 0;
    return 0;
  }

  reviewStats = computed(() => {
    const m = this._mgrData();
    if (!m) return null;
    return { rejected: m.rejectedCount ?? 0 };
  });

  get teamStatCards(): { value: number }[] {
    const m = this._mgrData();
    return [
      { value: m?.teamSize               ?? 0 },
      { value: m?.pendingSubmissionCount ?? 0 },
      { value: m?.overdueReviewCount     ?? 0 },
      { value: m?.rejectedCount          ?? 0 },
    ];
  }

  get teamMembers(): { name: string; dept: string; score: number; status: string }[] {
    const m = this._mgrData();
    if (!m) return this._staticTeamMembers;
    const all: TopPerformerDto[] = [
      ...(m.topTeamPerformers    ?? []),
      ...(m.bottomTeamPerformers ?? []),
    ];
    if (!all.length) return this._staticTeamMembers;
    return all.map(p => ({
      name:   p.fullName,
      dept:   p.departmentName,
      score:  Math.round(p.score),
      status: (p.performanceBand ?? 'average').toLowerCase().replace(/_/g, ' '),
    }));
  }

  // ── Executive dashboard ────────────────────────────────────────────────────
  get municipalScore(): number {
    const exec = this._execData();
    if (exec?.overallPerformance) return exec.overallPerformance;
    // Computed directly from all performance record scores
    const computed = this._computedScore();
    if (computed > 0) return computed;
    // Fallback: average of depts that have scores
    const depts = this._liveDeptPerf().filter(d => d.score > 0);
    if (depts.length) return Math.round(depts.reduce((s, d) => s + d.score, 0) / depts.length);
    return 0;
  }

  get execStatCards(): { value: number }[] {
    const e = this._execData();
    return [
      { value: e?.totalDepartments ?? this._deptCount() },
      { value: e?.totalEmployees   ?? this._empCount()  },
      { value: e?.criticalKpis     ?? this._activeKpiCount() },
      { value: e?.pendingApprovals ?? this._pendingCount() },
      { value: e?.lateSubmissions  ?? this._overdueCount() },
    ];
  }

  liveDepts = computed(() => {
    const e = this._execData();
    if (e) return [...(e.topDepartments ?? []), ...(e.bottomDepartments ?? [])];
    return null;
  });

  get displayDepts(): { name: string; score: number; trend: string; color: string }[] {
    const live = this.liveDepts();
    if (live?.length) {
      return live.slice(0, 10).map(d => ({
        name:  d.departmentName,
        score: Math.round(d.averageScore ?? 0),
        trend: 'stable',
        color: this.scoreColor(d.averageScore ?? 0),
      }));
    }
    // Use directly-loaded dept performance data
    const direct = this._liveDeptPerf();
    if (direct.length) return direct;
    return [];   // no static fallback — show empty
  }

  get riskItems(): { dept: string; risk: string; performance: string }[] {
    const e = this._execData();
    if (e?.riskHeatMap?.length) {
      return e.riskHeatMap.slice(0, 5).map((r: RiskHeatMapDto) => ({
        dept:        r.departmentName,
        risk:        (r.riskLevel ?? 'low').toLowerCase(),
        performance: this.scoreStatus(r.score ?? 0),
      }));
    }
    // Build risk from live dept performance (score < 75 = medium, < 60 = high)
    const depts = this._liveDeptPerf();
    if (depts.length) {
      return depts.slice(0, 5).map(d => ({
        dept:        d.name,
        risk:        d.score >= 75 ? 'low' : d.score >= 60 ? 'medium' : 'high',
        performance: this.scoreStatus(d.score),
      }));
    }
    return [];
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const type = this.dashboardType;

    if (type === 'employee') {
      this.dashboardSvc.getEmployeeDashboard().subscribe({
        next:  d => { this._empData.set(d);  this.isLoading.set(false); },
        error: () => {                        this.isLoading.set(false); },
      });
    } else if (type === 'manager') {
      this.dashboardSvc.getManagerDashboard().subscribe({
        next:  d => { this._mgrData.set(d);  this.isLoading.set(false); },
        error: () => {                        this.isLoading.set(false); },
      });
    } else {
      // Executive: load everything in parallel
      forkJoin({
        exec:      this.dashboardSvc.getExecutiveDashboard().pipe(catchError(() => of(null))),
        depts:     this.deptService.getAll(undefined, 0, 100).pipe(catchError(() => of(null))),
        divisions: this.divisionSvc.getAll().pipe(catchError(() => of([]))),
        emps:      this.empService.getAll({ size: 500 }).pipe(catchError(() => of(null))),
        activeKpi: this.kpiService.getAll({ status: 'ACTIVE', size: 1 }).pipe(catchError(() => of(null))),
        submitted: this.perfService.getAll({ status: 'SUBMITTED', size: 200 }).pipe(catchError(() => of([]))),
        reviews:   this.reviewService.getAll({ size: 200 }).pipe(catchError(() => of([]))),
        allPerf:   this.perfService.getAll({ size: 500 }).pipe(catchError(() => of([]))),
      }).subscribe({
        next: ({ exec, depts, divisions, emps, activeKpi, submitted, reviews, allPerf }) => {
          // ── Set exec data if available ───────────────────────────────────
          if (exec) this._execData.set(exec);

          // ── Real counts ──────────────────────────────────────────────────
          const deptList = depts?.content ?? [];
          this._deptCount.set(depts?.totalElements ?? deptList.length);
          this._empCount.set(emps?.totalElements ?? 0);
          this._activeKpiCount.set(activeKpi?.totalElements ?? 0);

          // Pending = SUBMITTED performance records + PENDING formal reviews
          const perfPending   = Array.isArray(submitted) ? submitted.length : 0;
          const reviewPending = Array.isArray(reviews) ? reviews.filter(r =>
            r.status === 'PENDING' || r.status === 'IN_PROGRESS'
          ).length : 0;
          this._pendingCount.set(perfPending + reviewPending);
          this._overdueCount.set(0);   // No API endpoint — will be enhanced later

          // ── Build employee → department map ──────────────────────────────
          const empList = emps?.content ?? [];
          const empDeptMap = new Map<number, string>();
          for (const emp of empList) {
            if (emp.id && emp.departmentName) {
              empDeptMap.set(emp.id, emp.departmentName);
            }
          }

          // ── Build division → department map ───────────────────────────────
          const divList = Array.isArray(divisions) ? divisions : [];
          const divDeptMap = new Map<number, string>();
          for (const div of divList) {
            if (div.id && div.departmentName) {
              divDeptMap.set(div.id, div.departmentName);
            }
          }

          // ── Build dept performance from real perf records ────────────────
          const perfArr = Array.isArray(allPerf) ? allPerf : [];

          // Helper: extract or compute score from a perf record
          const extractScore = (p: any): number | null => {
            const stored = p.score ?? p.achievementPct;
            if (typeof stored === 'number' && stored > 0) return stored;
            if (p.actualValue != null && p.targetValue != null && p.targetValue > 0) {
              return Math.round((p.actualValue / p.targetValue) * 100);
            }
            return null;
          };

          // Resolve department name for each perf record:
          // 1. Try p.departmentName directly (some APIs include it)
          // 2. Resolve from employee map via assigneeId when EMPLOYEE
          // 3. Resolve from division map via assigneeId when DIVISION
          // 4. Direct match when DEPARTMENT
          const resolveDept = (p: any): string | null => {
            if (p.departmentName) return p.departmentName;
            if ((p.assigneeType === 'EMPLOYEE' || !p.assigneeType) && p.assigneeId) {
              return empDeptMap.get(p.assigneeId) ?? null;
            }
            if (p.assigneeType === 'DIVISION' && p.assigneeId) {
              return divDeptMap.get(p.assigneeId) ?? null;
            }
            if (p.assigneeType === 'DEPARTMENT') {
              const dept = deptList.find((d: any) => d.id === p.assigneeId);
              return dept?.name ?? null;
            }
            return null;
          };

          // Overall score = average of all records that have a computable score
          const allScores = perfArr
            .map(extractScore)
            .filter((s): s is number => s != null && s >= 0);
          if (allScores.length) {
            this._computedScore.set(
              Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            );
          }

          if (!exec?.topDepartments?.length && deptList.length > 0) {
            // Group scores by resolved department name
            const deptScores: Record<string, number[]> = {};
            for (const p of perfArr) {
              const key = resolveDept(p);
              const s   = extractScore(p);
              if (key && s != null) {
                if (!deptScores[key]) deptScores[key] = [];
                deptScores[key].push(s);
              }
            }

            const deptPerf = deptList.map((d: any) => {
              const scores = deptScores[d.name] ?? [];
              const avg    = scores.length
                ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                : 0;
              return {
                name:  d.name,
                score: avg,
                trend: 'stable' as const,
                color: this.scoreColor(avg),
              };
            }).sort((a: any, b: any) => b.score - a.score);

            this._liveDeptPerf.set(deptPerf);
          }

          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  // ── Role helpers ──────────────────────────────────────────────────────────
  get dashboardType(): 'executive' | 'manager' | 'employee' {
    const all = [...(this.currentUser()?.roles ?? []), ...(this.currentUser()?.permissions ?? [])];
    if (all.some(r => ['ROLE_ADMIN','ADMIN','ROLE_EXECUTIVE','ROLE_MUNICIPAL_MANAGER','MUNICIPAL_MANAGER','ROLE_DIRECTOR','DIRECTOR'].includes(r))) return 'executive';
    if (all.some(r => ['ROLE_MANAGER','MANAGER','ROLE_HR','HR'].includes(r)) || this.authService.hasAnyPermission(['KPI_REVIEW'])) return 'manager';
    return 'employee';
  }

  get greeting():      string { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  get currentPeriod(): string { return new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(new Date()); }
  get firstName():     string { return this.currentUser()?.fullName?.split(' ')[0] ?? 'there'; }

  // ── Static fallback data (employee/manager) ───────────────────────────────
  upcomingDeadlines = [
    { date: '29 Aug', label: 'KPI Submission',      urgent: true  },
    { date: '05 Sep', label: 'Evidence Submission',  urgent: false },
    { date: '15 Sep', label: 'Self-Assessment Due',  urgent: false },
  ];

  recentActivity = [
    { icon: 'check_circle', text: 'KPI submitted successfully',          type: 'success', time: '2h ago' },
    { icon: 'verified',     text: 'Evidence approved by manager',        type: 'success', time: '1d ago' },
    { icon: 'warning',      text: 'Manager requested changes on KPI #4', type: 'warning', time: '2d ago' },
    { icon: 'comment',      text: 'New comment on your submission',      type: 'info',    time: '3d ago' },
  ];

  private _staticTeamMembers = [
    { name: 'John Smith',     dept: 'Finance', score: 94, status: 'excellent' },
    { name: 'Mary Jones',     dept: 'Finance', score: 88, status: 'good'      },
    { name: 'Sarah Williams', dept: 'Finance', score: 95, status: 'excellent' },
    { name: 'Peter Nkosi',    dept: 'Finance', score: 72, status: 'average'   },
    { name: 'David Mokoena',  dept: 'Finance', score: 51, status: 'poor'      },
  ];

  // ── No static dept data (show empty if no real data) ─────────────────────
  staticDepts: { name: string; score: number; trend: string; color: string }[] = [];

  // ── Utility helpers ────────────────────────────────────────────────────────
  scoreStatus(s: number) { return s >= 90 ? 'excellent' : s >= 75 ? 'good' : s >= 60 ? 'average' : 'poor'; }
  scoreBadge(s: number)  { return s >= 90 ? 'badge-success' : s >= 75 ? 'badge-primary' : s >= 60 ? 'badge-warning' : 'badge-danger'; }
  scoreColor(s: number)  { return s >= 90 ? 'green' : s >= 75 ? 'blue' : s >= 60 ? 'orange' : 'red'; }
  trendIcon(t: string)   { return t === 'up' ? 'trending_up' : t === 'down' ? 'trending_down' : 'trending_flat'; }
  riskColor(l: string)   { return l === 'high' ? '#ef4444' : l === 'medium' ? '#f59e0b' : '#10b981'; }
  gaugeOffset(s: number) { return 2 * Math.PI * 54 * (1 - s / 100); }
  getInitials(name: string) { const p = name.split(' '); return (p[0]?.[0] ?? '') + (p[1]?.[0] ?? ''); }
}
