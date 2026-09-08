import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DepartmentService }    from '../../../core/services/department.service';
import { DivisionService }      from '../../../core/services/division.service';
import { EmployeeService }      from '../../../core/services/employee.service';
import { KpiAssignmentService } from '../../../core/services/kpi-assignment.service';
import { PerformanceService }   from '../../performance/services/performance.service';
import { AuthService }          from '../../../core/auth/auth.service';
import { ToastService }         from '../../../core/services/toast.service';
import { PositionService, Position } from '../../../core/services/position.service';
import { Department }     from '../../../core/models/department.model';
import { Division }       from '../../../core/models/division.model';
import { Employee }       from '../../../core/models/employee.model';
import { KpiAssignment, AssignmentStatus } from '../../../core/models/kpi-assignment.model';
import { PerformanceRecord }    from '../../performance/models/performance-record.model';
import { Page }           from '../../../core/models/page.model';
import { TitleCasePipe, DecimalPipe } from '@angular/common';

type DeptTab = 'overview' | 'divisions' | 'employees' | 'kpis' | 'performance';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './department-detail.html',
  styleUrl:    './department-detail.css'
})
export class DepartmentDetail implements OnInit {
  private route             = inject(ActivatedRoute);
  private deptService       = inject(DepartmentService);
  private divisionService   = inject(DivisionService);
  private employeeService   = inject(EmployeeService);
  private assignmentService = inject(KpiAssignmentService);
  private perfService       = inject(PerformanceService);
  private authService       = inject(AuthService);
  private toast             = inject(ToastService);
  private positionService   = inject(PositionService);
  private router            = inject(Router);
  private location          = inject(Location);

  deptId    = 0;
  dept      = signal<Department | null>(null);
  divisions = signal<Division[]>([]);
  empPage   = signal<Page<Employee> | null>(null);

  // KPIs tab
  assignments    = signal<KpiAssignment[]>([]);
  kpisLoading    = signal(false);
  kpisLoaded     = signal(false);

  // Performance tab
  perfRecords    = signal<PerformanceRecord[]>([]);
  perfLoading    = signal(false);
  perfLoaded     = signal(false);

  isLoading       = signal(true);
  divisionsLoaded = signal(false);
  empsLoading     = signal(false);
  error           = signal<string | null>(null);

  // ── Add Division modal ────────────────────────────────────────────────────
  showAddDivisionModal = signal(false);
  isSavingDivision     = signal(false);

  divisionForm = new FormGroup({
    name:        new FormControl('', Validators.required),
    code:        new FormControl('', Validators.required),
    description: new FormControl(''),
    enabled:     new FormControl(true),
  });

  // ── Add Position modal ────────────────────────────────────────────────────
  showAddPositionModal  = signal(false);
  isSavingPosition      = signal(false);
  addPositionDivisionId = signal<number>(0);
  addPositionDivisionName = signal<string>('');
  /** positions per divisionId */
  divisionPositions     = signal<Record<number, Position[]>>({});

  positionForm = new FormGroup({
    name:        new FormControl('', Validators.required),
    code:        new FormControl('', Validators.required),
    gradeLevel:  new FormControl(''),
    description: new FormControl(''),
    enabled:     new FormControl(true),
  });

  get canManage(): boolean {
    return this.authService.hasAnyPermission(['ADMIN', 'DEPT_MANAGE']);
  }

  activeTab = signal<DeptTab>('overview');
  empCurrentPage = 0;

  // KPI summary computed
  kpiSummary = computed(() => {
    const list = this.assignments();
    return {
      total:     list.length,
      active:    list.filter(a => a.status === 'ACTIVE').length,
      draft:     list.filter(a => a.status === 'DRAFT').length,
      completed: list.filter(a => a.status === 'COMPLETED').length,
      cancelled: list.filter(a => a.status === 'CANCELLED').length,
    };
  });

  /** Per-division employee counts derived from loaded employees */
  divisionEmpCounts = computed<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    for (const emp of this.empPage()?.content ?? []) {
      if (emp.divisionId != null) {
        counts[emp.divisionId] = (counts[emp.divisionId] ?? 0) + 1;
      }
    }
    return counts;
  });

  divisionEmpCount(divisionId: number): number {
    return this.divisionEmpCounts()[divisionId] ?? 0;
  }

  positionsForDiv(divisionId: number): Position[] {
    return this.divisionPositions()[divisionId] ?? [];
  }

  // Performance summary computed
  perfSummary = computed(() => {
    const list = this.perfRecords();
    const scores = list.map(r => r.score ?? r.achievementPct).filter((s): s is number => s != null);
    return {
      total:     list.length,
      submitted: list.filter(r => r.status === 'SUBMITTED').length,
      approved:  list.filter(r => r.status === 'APPROVED').length,
      avgScore:  scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  });

  tabs: { key: DeptTab; label: string; icon: string }[] = [
    { key: 'overview',    label: 'Overview',    icon: 'info'          },
    { key: 'divisions',   label: 'Divisions',   icon: 'account_tree'  },
    { key: 'employees',   label: 'Employees',   icon: 'people'        },
    { key: 'kpis',        label: 'KPIs',        icon: 'task_alt'      },
    { key: 'performance', label: 'Performance', icon: 'trending_up'   }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.deptId = Number(p.get('id'));
      this.loadDept();
    });
  }

  loadDept(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.deptService.getById(this.deptId).subscribe({
      next:  d  => {
        this.dept.set(d);
        this.isLoading.set(false);
        // Load supporting data eagerly so hero stats populate
        this.loadDivisions();
        this.loadEmployees(0);
        this.loadKpis();
      },
      error: err => {
        this.error.set(err.status === 404 ? 'Department not found.' : 'Failed to load department.');
        this.isLoading.set(false);
      }
    });
  }

  loadDivisions(): void {
    this.divisionService.getAll(this.deptId).subscribe({
      next: divs => {
        this.divisions.set(divs);
        this.divisionsLoaded.set(true);
        // Load positions for each division
        divs.forEach(div => this.loadPositionsForDiv(div.id));
      }
    });
  }

  loadPositionsForDiv(divisionId: number): void {
    this.positionService.getAll(divisionId).subscribe({
      next: positions => {
        this.divisionPositions.update(map => ({ ...map, [divisionId]: positions }));
      }
    });
  }


  loadEmployees(page = 0): void {
    this.empsLoading.set(true);
    this.empCurrentPage = page;
    // Use a larger page size on first load so division counts are accurate
    const size = page === 0 ? 200 : 20;
    this.employeeService.getAll({ departmentId: this.deptId, page, size }).subscribe({
      next:  data => { this.empPage.set(data); this.empsLoading.set(false); },
      error: ()   => this.empsLoading.set(false)
    });
  }

  loadKpis(): void {
    if (this.kpisLoaded()) return;
    this.kpisLoading.set(true);

    // Assignments use assigneeId = employee.id; the assignment record itself doesn't
    // carry departmentId/departmentName reliably. We cross-reference by loading
    // this department's employees alongside all assignments, then keep only assignments
    // whose assigneeId is one of those employees (or directly assigned to this dept).
    forkJoin({
      assignments: this.assignmentService.getAll({}),
      employees:   this.employeeService.getAll({ departmentId: this.deptId, page: 0, size: 500 }),
    }).subscribe({
      next: ({ assignments, employees }) => {
        const empIds = new Set(employees.content.map(e => e.id));
        const filtered = assignments.filter(a =>
          // Employee-level assignment belonging to this dept's staff
          (a.assigneeType === 'EMPLOYEE' && a.assigneeId != null && empIds.has(a.assigneeId)) ||
          // Dept-level assignment directly on this department
          (a.assigneeType === 'DEPARTMENT' && a.assigneeId === this.deptId) ||
          // Fallback: numeric or name match if backend populates those fields
          a.departmentId === this.deptId ||
          (this.dept()?.name != null && a.departmentName === this.dept()!.name)
        );
        this.assignments.set(filtered);
        this.kpisLoaded.set(true);
        this.kpisLoading.set(false);
      },
      error: () => this.kpisLoading.set(false),
    });
  }

  loadPerformance(): void {
    this.perfLoading.set(true);
    this.perfLoaded.set(false);
    this.perfService.getAll({ departmentId: this.deptId, size: 200 }).subscribe({
      next:  list => { this.perfRecords.set(list); this.perfLoaded.set(true); this.perfLoading.set(false); },
      error: ()   => this.perfLoading.set(false)
    });
  }

  setTab(tab: DeptTab): void {
    this.activeTab.set(tab);
    if (tab === 'employees'   && !this.empPage())    this.loadEmployees();
    if (tab === 'kpis'        && !this.kpisLoaded()) this.loadKpis();
    if (tab === 'performance') this.loadPerformance();
  }

  goBack(): void { this.location.back(); }

  openAddDivision(): void {
    this.divisionForm.reset({ name: '', code: '', description: '', enabled: true });
    this.showAddDivisionModal.set(true);
  }

  closeAddDivision(): void { this.showAddDivisionModal.set(false); }

  saveDivision(): void {
    if (this.divisionForm.invalid) { this.divisionForm.markAllAsTouched(); return; }
    this.isSavingDivision.set(true);
    const v = this.divisionForm.value;
    this.divisionService.create({
      name:         v.name!,
      code:         v.code!,
      description:  v.description || undefined,
      departmentId: this.deptId,
      enabled:      v.enabled ?? true,
    }).subscribe({
      next: div => {
        this.isSavingDivision.set(false);
        this.showAddDivisionModal.set(false);
        this.toast.success('Division created', `"${div.name}" has been added successfully.`);
        this.loadDivisions();
      },
      error: err => {
        this.isSavingDivision.set(false);
        const msg = err.error?.message ?? err.error?.name ?? `HTTP ${err.status}`;
        this.toast.error('Failed to create division', msg);
      }
    });
  }

  // ── Position modal ────────────────────────────────────────────────────────
  openAddPosition(division: Division): void {
    this.addPositionDivisionId.set(division.id);
    this.addPositionDivisionName.set(division.name);
    this.positionForm.reset({ name: '', code: '', gradeLevel: '', description: '', enabled: true });
    this.showAddPositionModal.set(true);
  }

  closeAddPosition(): void { this.showAddPositionModal.set(false); }

  savePosition(): void {
    if (this.positionForm.invalid) { this.positionForm.markAllAsTouched(); return; }
    this.isSavingPosition.set(true);
    const v = this.positionForm.value;
    this.positionService.create({
      name:        v.name!,
      code:        v.code!,
      gradeLevel:  v.gradeLevel || undefined,
      description: v.description || undefined,
      divisionId:  this.addPositionDivisionId(),
      enabled:     v.enabled ?? true,
    }).subscribe({
      next: pos => {
        this.isSavingPosition.set(false);
        this.showAddPositionModal.set(false);
        this.toast.success('Position created', `"${pos.name}" has been added.`);
        this.loadPositionsForDiv(this.addPositionDivisionId());
      },
      error: err => {
        this.isSavingPosition.set(false);
        this.toast.error('Failed to create position', err.error?.message ?? `HTTP ${err.status}`);
      }
    });
  }

  fieldError(name: string, form: 'division' | 'position' = 'division'): boolean {
    const f = (form === 'position' ? this.positionForm : this.divisionForm) as FormGroup;
    const c = f.get(name);
    return !!(c?.invalid && c.touched);
  }

  viewEmployee(id: number): void { this.router.navigate(['/employees', id]); }
  viewAssignment(id: number): void { this.router.navigate(['/assignments', id]); }

  get employees():      Employee[] { return this.empPage()?.content ?? []; }
  get totalEmpPages():  number     { return this.empPage()?.totalPages ?? 0; }
  get totalEmpEls():    number     { return this.empPage()?.totalElements ?? 0; }

  get pageNumbers(): number[] {
    const total = this.totalEmpPages;
    const cur   = this.empCurrentPage;
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    const end   = Math.min(total - 1, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  scoreColor(score?: number | null): string {
    if (!score) return 'gray';
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 60) return 'orange';
    return 'red';
  }

  scoreClass(score?: number | null): string {
    if (!score) return 'none';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  getInitials(name: string): string {
    const p = name.split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-success', INACTIVE: 'badge-gray', SUSPENDED: 'badge-danger',
      DRAFT: 'badge-gray', COMPLETED: 'badge-primary', CANCELLED: 'badge-danger',
    };
    return map[status] ?? 'badge-gray';
  }

  assignmentStatusBadge(s: AssignmentStatus): string {
    return { ACTIVE: 'badge-success', DRAFT: 'badge-gray', COMPLETED: 'badge-primary', CANCELLED: 'badge-danger' }[s] ?? 'badge-gray';
  }

  perfStatusBadge(s: string): string {
    return { DRAFT: 'badge-gray', SUBMITTED: 'badge-warning', REVIEWED: 'badge-info', APPROVED: 'badge-success', REJECTED: 'badge-danger' }[s] ?? 'badge-gray';
  }
}

