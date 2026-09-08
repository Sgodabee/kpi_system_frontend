import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepartmentService }    from '../../../core/services/department.service';
import { DivisionService }      from '../../../core/services/division.service';
import { EmployeeService }      from '../../../core/services/employee.service';
import { KpiAssignmentService } from '../../../core/services/kpi-assignment.service';
import { AuthService }          from '../../../core/auth/auth.service';
import { ToastService }         from '../../../core/services/toast.service';
import { Department }           from '../../../core/models/department.model';

@Component({
  selector: 'app-org-overview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './org-overview.html',
  styleUrl: './org-overview.css'
})
export class OrgOverview implements OnInit {
  private deptService  = inject(DepartmentService);
  private divService   = inject(DivisionService);
  private empService   = inject(EmployeeService);
  private kpiService   = inject(KpiAssignmentService);
  private authService  = inject(AuthService);
  private toast        = inject(ToastService);
  private router       = inject(Router);

  departments: Department[] = [];
  isLoading   = signal(true);
  error       = signal<string | null>(null);
  searchQuery = '';

  /** Real employee total from API */
  private _totalEmpCount = signal(0);

  // ── Add Department modal ──────────────────────────────────────────────────
  showAddModal = signal(false);
  isSaving     = signal(false);

  deptForm = new FormGroup({
    name:        new FormControl('', Validators.required),
    code:        new FormControl('', Validators.required),
    description: new FormControl(''),
    enabled:     new FormControl(true),
  });

  get filteredDepts(): Department[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.departments;
    return this.departments.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.directorName ?? '').toLowerCase().includes(q) ||
      (d.code ?? '').toLowerCase().includes(q)
    );
  }

  get totalEmployees(): number {
    const real = this._totalEmpCount();
    if (real > 0) return real;
    return this.departments.reduce((sum, d) => sum + (d.employeeCount ?? 0), 0);
  }

  get canManage(): boolean {
    return this.authService.hasAnyPermission(['ADMIN', 'DEPT_MANAGE']);
  }

  /** Derive municipalityId from loaded departments, fallback to 1 */
  private get municipalityId(): number {
    return this.departments[0]?.municipalityId ?? 1;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      depts: this.deptService.getAll(),
      emps:  this.empService.getAll({ size: 500 }).pipe(catchError(() => of(null))),
      divs:  this.divService.getAll().pipe(catchError(() => of([]))),
      kpis:  this.kpiService.getAll({ status: 'ACTIVE', size: 500 }).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ depts, emps, divs, kpis }) => {
        const deptList = depts.content ?? [];

        const empTotal = emps?.totalElements ?? (emps?.content?.length ?? 0);
        this._totalEmpCount.set(empTotal);

        const empCounts: Record<number, number> = {};
        for (const e of emps?.content ?? []) {
          if (e.departmentId != null) {
            empCounts[e.departmentId] = (empCounts[e.departmentId] ?? 0) + 1;
          }
        }

        const divCounts: Record<number, number> = {};
        const divArr = Array.isArray(divs) ? divs : [];
        for (const d of divArr) {
          if (d.departmentId != null) {
            divCounts[d.departmentId] = (divCounts[d.departmentId] ?? 0) + 1;
          }
        }

        // Build a map of employeeId → departmentId for cross-referencing
        const empDeptMap: Record<number, number> = {};
        for (const e of emps?.content ?? []) {
          if (e.id != null && e.departmentId != null) {
            empDeptMap[e.id] = e.departmentId;
          }
        }

        const kpiCounts: Record<number, number> = {};
        const kpiArr = Array.isArray(kpis) ? kpis : [];
        for (const k of kpiArr) {
          if (k.assigneeType === 'DEPARTMENT' && k.assigneeId != null) {
            // KPI assigned directly to a department
            kpiCounts[k.assigneeId] = (kpiCounts[k.assigneeId] ?? 0) + 1;
          } else if (k.assigneeType === 'EMPLOYEE' && k.assigneeId != null) {
            // KPI assigned to an employee — look up that employee's department
            const deptId = k.departmentId ?? empDeptMap[k.assigneeId];
            if (deptId != null) {
              kpiCounts[deptId] = (kpiCounts[deptId] ?? 0) + 1;
            }
          } else if (k.departmentId != null) {
            // Fallback: assignment has departmentId directly
            kpiCounts[k.departmentId] = (kpiCounts[k.departmentId] ?? 0) + 1;
          }
        }

        this.departments = deptList.map(d => ({
          ...d,
          employeeCount:  empCounts[d.id]  ?? d.employeeCount,
          divisionCount:  divCounts[d.id]  ?? d.divisionCount,
          activeKpiCount: kpiCounts[d.id]  ?? d.activeKpiCount,
        }));

        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.status === 0
          ? 'Cannot connect to the server. Ensure the backend is running on port 8081.'
          : `Failed to load departments (HTTP ${err.status}).`);
        this.isLoading.set(false);
      }
    });
  }

  openAdd(): void {
    this.deptForm.reset({ name: '', code: '', description: '', enabled: true });
    this.showAddModal.set(true);
  }

  closeAdd(): void { this.showAddModal.set(false); }

  saveDepartment(): void {
    if (this.deptForm.invalid) { this.deptForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.deptForm.value;
    this.deptService.create({
      name:           v.name!,
      code:           v.code!,
      description:    v.description || undefined,
      municipalityId: this.municipalityId,
      enabled:        v.enabled ?? true,
    }).subscribe({
      next: dept => {
        this.isSaving.set(false);
        this.showAddModal.set(false);
        this.toast.success('Department created', `"${dept.name}" has been added successfully.`);
        this.load();
      },
      error: err => {
        this.isSaving.set(false);
        const msg = err.error?.message ?? err.error?.name ?? `HTTP ${err.status}`;
        this.toast.error('Failed to create department', msg);
      }
    });
  }

  fieldError(name: string): boolean {
    const c = this.deptForm.get(name);
    return !!(c?.invalid && c.touched);
  }

  goTo(id: number): void { this.router.navigate(['/departments', id]); }

  scoreColor(score?: number): string {
    if (!score) return 'gray';
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 60) return 'orange';
    return 'red';
  }

  scoreClass(score?: number): string {
    if (!score) return 'none';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }
}

