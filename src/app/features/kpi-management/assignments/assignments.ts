import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { KpiAssignmentService } from '../../../core/services/kpi-assignment.service';
import { DepartmentService }    from '../../../core/services/department.service';
import { DivisionService }      from '../../../core/services/division.service';
import { EmployeeService }      from '../../../core/services/employee.service';
import { KpiService }           from '../../../core/services/kpi.service';
import { AuthService }          from '../../../core/auth/auth.service';
import { ToastService }         from '../../../core/services/toast.service';
import { KpiAssignment, AssignmentFilter, AssignmentStatus, AssigneeType, AssignmentRequest } from '../../../core/models/kpi-assignment.model';
import { Department }           from '../../../core/models/department.model';
import { Division }             from '../../../core/models/division.model';
import { Employee }             from '../../../core/models/employee.model';
import { Kpi }                  from '../../../core/models/kpi.model';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',          label: 'All Statuses' },
  { value: 'DRAFT',     label: 'Draft'        },
  { value: 'ACTIVE',    label: 'Active'       },
  { value: 'COMPLETED', label: 'Completed'    },
  { value: 'CANCELLED', label: 'Cancelled'    },
];

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './assignments.html',
  styleUrl:    './assignments.css'
})
export class Assignments implements OnInit, OnDestroy {
  private assignmentService = inject(KpiAssignmentService);
  private deptService       = inject(DepartmentService);
  private divisionService   = inject(DivisionService);
  private employeeService   = inject(EmployeeService);
  private kpiService        = inject(KpiService);
  private authService       = inject(AuthService);
  private toast             = inject(ToastService);
  private router            = inject(Router);
  private destroy$          = new Subject<void>();

  /** All assignments returned by the API (not paged — client-side pagination) */
  allAssignments = signal<KpiAssignment[]>([]);
  departments    = signal<Department[]>([]);
  isLoading      = signal(true);
  error          = signal<string | null>(null);

  searchCtrl      = new FormControl('');
  selectedDept    = 0;
  selectedStatus  = '';
  selectedYear    = '';
  currentPage     = 0;
  pageSize        = 20;
  sortField       = 'kpiDefinitionName';
  sortDir: 'asc' | 'desc' = 'asc';

  readonly statusOptions = STATUS_OPTIONS;

  // ── Assign KPI modal ────────────────────────────────────────────────
  showModal    = signal(false);
  isSaving     = signal(false);
  kpis         = signal<Kpi[]>([]);
  employees    = signal<Employee[]>([]);
  divisions    = signal<Division[]>([]);
  kpisLoading  = signal(false);

  assignForm = new FormGroup({
    kpiDefinitionId: new FormControl<number | null>(null, Validators.required),
    assigneeType:    new FormControl<AssigneeType>('EMPLOYEE', Validators.required),
    assigneeId:      new FormControl<number | null>(null, Validators.required),
    periodType:      new FormControl('MONTHLY'),
    periodYear:      new FormControl<number>(new Date().getFullYear(), Validators.required),
    periodNumber:    new FormControl<number>(new Date().getMonth() + 1, Validators.required),
    targetValue:     new FormControl<number | null>(null, Validators.required),
    weight:          new FormControl<number | null>(null),
    dueDate:         new FormControl<string | null>(null),
    status:          new FormControl<AssignmentStatus>('ACTIVE'),
    notes:           new FormControl(''),
  });

  get assigneeTypeValue(): AssigneeType {
    return (this.assignForm.get('assigneeType')?.value as AssigneeType) ?? 'EMPLOYEE';
  }

  get periodNumberLabel(): string {
    const pt = this.assignForm.get('periodType')?.value;
    if (pt === 'QUARTERLY')  return 'Quarter (1-4)';
    if (pt === 'ANNUALLY')   return 'Period (always 1)';
    return 'Month (1-12)';
  }

  get periodNumberMax(): number {
    const pt = this.assignForm.get('periodType')?.value;
    if (pt === 'QUARTERLY') return 4;
    if (pt === 'ANNUALLY')  return 1;
    return 12;
  }

  // ── Enrich raw assignments with KPI / employee / dept names ─────────────
  enriched = computed(() => {
    const list    = this.allAssignments();
    const kpiMap  = new Map(this.kpis().map(k => [k.id, k]));
    const empMap  = new Map(this.employees().map(e => [e.id, e]));
    const deptMap = new Map(this.departments().map(d => [d.id, d]));

    return list.map(a => {
      const kpi  = kpiMap.get(a.kpiDefinitionId ?? a.kpiId ?? 0);
      const emp  = a.assigneeType === 'EMPLOYEE'
        ? empMap.get(a.assigneeId ?? a.employeeId ?? 0) : null;
      const dept = a.assigneeType === 'DEPARTMENT'
        ? deptMap.get(a.assigneeId ?? 0)
        : deptMap.get(a.departmentId ?? 0);

      return {
        ...a,
        kpiName:       a.kpiDefinitionName ?? a.kpiName ?? kpi?.name,
        kpiCode:       a.kpiDefinitionCode ?? a.kpiCode ?? kpi?.code,
        unit:          a.unit ?? kpi?.unit,
        employeeName:  a.employeeName
          ?? (emp ? `${emp.firstName} ${emp.lastName}` : undefined),
        departmentName:a.departmentName ?? dept?.name ?? emp?.departmentName,
      };
    });
  });

  // ── Filtered + sorted list (client-side) ─────────────────
  get filtered(): KpiAssignment[] {
    const q    = (this.searchCtrl.value ?? '').toLowerCase();
    const dept = this.selectedDept;
    const stat = this.selectedStatus;
    return this.enriched().filter(a => {
      const matchQ    = !q    || (a.kpiName ?? '').toLowerCase().includes(q)
                               || (a.kpiCode ?? '').toLowerCase().includes(q)
                               || (a.notes ?? '').toLowerCase().includes(q);
      const matchDept = !dept || a.departmentId === dept;
      const matchStat = !stat || a.status === stat;
      return matchQ && matchDept && matchStat;
    });
  }

  get assignments(): KpiAssignment[] {
    const sorted = [...this.filtered].sort((a, b) => {
      const av = String((a as any)[this.sortField] ?? '');
      const bv = String((b as any)[this.sortField] ?? '');
      return this.sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return sorted.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize);
  }

  get total():      number { return this.filtered.length; }
  get totalPages(): number { return Math.ceil(this.total / this.pageSize); }
  get startItem():  number { return this.total ? this.currentPage * this.pageSize + 1 : 0; }
  get endItem():    number { return Math.min((this.currentPage + 1) * this.pageSize, this.total); }

  get canAssign(): boolean {
    return this.authService.hasAnyPermission(['ADMIN', 'KPI_MANAGE']);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages, cur = this.currentPage;
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    const end   = Math.min(total - 1, start + 4);
    if (start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Summary counts
  get draftCount():     number { return this.enriched().filter(a => a.status === 'DRAFT').length; }
  get activeCount():    number { return this.enriched().filter(a => a.status === 'ACTIVE').length; }
  get completedCount(): number { return this.enriched().filter(a => a.status === 'COMPLETED').length; }
  get cancelledCount(): number { return this.enriched().filter(a => a.status === 'CANCELLED').length; }

  ngOnInit(): void {
    this.deptService.getAll().subscribe({ next: p => this.departments.set(p.content ?? []) });
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 0; });
    // Load KPIs for the modal
    this.kpisLoading.set(true);
    this.kpiService.getAll({ size: 200, status: 'ACTIVE' }).subscribe({
      next: p => { this.kpis.set(p.content ?? []); this.kpisLoading.set(false); },
      error: () => this.kpisLoading.set(false)
    });
    // Load employees for the modal
    this.employeeService.getAll({ size: 200 }).subscribe({
      next: p => this.employees.set(p.content ?? [])
    });
    this.load();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const filter: AssignmentFilter = {
      status: this.selectedStatus || undefined,
      year:   this.selectedYear   ? Number(this.selectedYear) : undefined,
    };
    this.assignmentService.getAll(filter).subscribe({
      next:  list => { this.allAssignments.set(list); this.isLoading.set(false); },
      error: err  => {
        this.error.set(err.status === 0 ? 'Cannot connect to server.' : `Failed to load assignments (HTTP ${err.status}).`);
        this.isLoading.set(false);
      }
    });
  }

  // ── Modal actions ──────────────────────────────────────────────────
  openAssign(): void {
    this.assignForm.reset({
      kpiDefinitionId: null,
      assigneeType:    'EMPLOYEE',
      assigneeId:      null,
      periodType:      'MONTHLY',
      periodYear:      new Date().getFullYear(),
      periodNumber:    new Date().getMonth() + 1,
      targetValue:     null,
      weight:          null,
      dueDate:         null,
      status:          'ACTIVE',
      notes:           '',
    });
    this.showModal.set(true);
  }

  closeAssign(): void { this.showModal.set(false); }

  onAssigneeTypeChange(): void {
    this.assignForm.get('assigneeId')?.setValue(null);
    const type = this.assigneeTypeValue;
    const ctrl = this.assignForm.get('assigneeId')!;
    if (type === 'MUNICIPALITY') {
      ctrl.clearValidators();
    } else {
      ctrl.setValidators(Validators.required);
    }
    ctrl.updateValueAndValidity();
    if (type === 'DIVISION') {
      this.divisionService.getAll().subscribe({ next: list => this.divisions.set(list) });
    }
  }

  onPeriodTypeChange(): void {
    const pt = this.assignForm.get('periodType')?.value;
    if (pt === 'ANNUALLY') {
      this.assignForm.get('periodNumber')?.setValue(1);
    }
  }

  saveAssignment(): void {
    if (this.assignForm.invalid) { this.assignForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.assignForm.value;
    const request: AssignmentRequest = {
      kpiDefinitionId: v.kpiDefinitionId!,
      assigneeType:    v.assigneeType as AssigneeType,
      assigneeId:      v.assigneeType === 'MUNICIPALITY' ? 1 : v.assigneeId!,
      periodType:      v.periodType as any,
      periodYear:      v.periodYear!,
      periodNumber:    v.periodNumber!,
      targetValue:     v.targetValue!,
      weight:          v.weight ?? undefined,
      dueDate:         v.dueDate   ?? undefined,
      status:          v.status as AssignmentStatus,
      notes:           v.notes || undefined,
    };

    this.assignmentService.create(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showModal.set(false);
        const kpiName = this.kpis().find(k => k.id === v.kpiDefinitionId)?.name ?? 'KPI';
        this.toast.success('KPI Assigned', `"${kpiName}" has been assigned successfully.`);
        this.load();
      },
      error: err => {
        this.isSaving.set(false);
        this.toast.error('Assignment failed', err.error?.message ?? `HTTP ${err.status}`);
      }
    });
  }

  // ── Filter / sort ──────────────────────────────────────────────────
  filterByStatus(status: string): void {
    this.selectedStatus = status; this.currentPage = 0;
  }
  onDeptChange(e: Event): void {
    this.selectedDept = Number((e.target as HTMLSelectElement).value);
    this.currentPage = 0;
  }
  onStatusChange(e: Event): void {
    this.selectedStatus = (e.target as HTMLSelectElement).value;
    this.currentPage = 0; this.load();
  }
  sort(field: string): void {
    this.sortDir = this.sortField === field ? (this.sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.sortField = field;
  }
  goToPage(p: number): void { this.currentPage = p; }
  viewAssignment(id: number): void { this.router.navigate(['/assignments', id]); }
  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.selectedDept = 0; this.selectedStatus = ''; this.selectedYear = '';
    this.currentPage = 0; this.load();
  }

  sortIcon(f: string): string {
    if (this.sortField !== f) return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  statusBadge(status?: AssignmentStatus | string): string {
    const map: Record<string, string> = {
      DRAFT:     'badge-gray',
      ACTIVE:    'badge-primary',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return map[status ?? ''] ?? 'badge-gray';
  }

  statusLabel(status?: AssignmentStatus | string): string {
    const map: Record<string, string> = {
      DRAFT:     'Draft',
      ACTIVE:    'Active',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return map[status ?? ''] ?? String(status ?? '');
  }

  statusIcon(status?: AssignmentStatus | string): string {
    const map: Record<string, string> = {
      DRAFT:     'edit_note',
      ACTIVE:    'pending_actions',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel',
    };
    return map[status ?? ''] ?? 'help';
  }

  achievementColor(pct?: number): string {
    if (!pct)       return 'gray';
    if (pct >= 100) return 'green';
    if (pct >= 75)  return 'blue';
    if (pct >= 50)  return 'orange';
    return 'red';
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  fieldError(name: string): boolean {
    const c = this.assignForm.get(name);
    return !!(c?.invalid && c.touched);
  }
}
