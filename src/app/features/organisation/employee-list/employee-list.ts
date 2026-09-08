import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TitleCasePipe } from '@angular/common';
import { EmployeeService }   from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { DivisionService }   from '../../../core/services/division.service';
import { PositionService, Position } from '../../../core/services/position.service';
import { AuthService }       from '../../../core/auth/auth.service';
import { ToastService }      from '../../../core/services/toast.service';
import { Employee, EmployeeFilter } from '../../../core/models/employee.model';
import { Department }               from '../../../core/models/department.model';
import { Division }                 from '../../../core/models/division.model';
import { Page }                     from '../../../core/models/page.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [ReactiveFormsModule, TitleCasePipe],
  templateUrl: './employee-list.html',
  styleUrl:    './employee-list.css'
})
export class EmployeeList implements OnInit, OnDestroy {
  private empService  = inject(EmployeeService);
  private deptService = inject(DepartmentService);
  private divService  = inject(DivisionService);
  private posService  = inject(PositionService);
  private authService = inject(AuthService);
  private toast       = inject(ToastService);
  private router      = inject(Router);
  private destroy$    = new Subject<void>();

  // Data
  page        = signal<Page<Employee> | null>(null);
  departments = signal<Department[]>([]);
  divisions   = signal<Division[]>([]);
  isLoading   = signal(true);
  error       = signal<string | null>(null);

  // Filters
  searchCtrl       = new FormControl('');
  selectedDept     = 0;
  selectedDiv      = 0;
  selectedStatus   = '';
  currentPage      = 0;
  pageSize         = 20;
  sortField        = 'fullName';
  sortDir: 'asc'|'desc' = 'asc';

  // ── Add Employee modal ─────────────────────────────────────────────────────
  showAddModal  = signal(false);
  isSaving      = signal(false);
  modalDivisions = signal<Division[]>([]);
  modalPositions = signal<Position[]>([]);

  empForm = new FormGroup({
    firstName:      new FormControl('', Validators.required),
    lastName:       new FormControl('', Validators.required),
    employeeNumber: new FormControl('', Validators.required),
    email:          new FormControl('', [Validators.required, Validators.email]),
    phone:          new FormControl(''),
    departmentId:   new FormControl<number | null>(null),
    divisionId:     new FormControl<number | null>(null),
    positionId:     new FormControl<number | null>(null, Validators.required),
    startDate:      new FormControl('', Validators.required),
    status:         new FormControl<string>('ACTIVE'),
  });

  // Computed
  get employees(): Employee[]  { return this.page()?.content ?? []; }
  get total(): number          { return this.page()?.totalElements ?? 0; }
  get totalPages(): number     { return this.page()?.totalPages ?? 0; }
  get startItem(): number      { return this.currentPage * this.pageSize + 1; }
  get endItem(): number        { return Math.min((this.currentPage + 1) * this.pageSize, this.total); }

  get canAdd(): boolean {
    return this.authService.hasAnyPermission(['ADMIN', 'EMP_MANAGE']);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    const end   = Math.min(total - 1, start + 4);
    if (start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  ngOnInit(): void {
    this.deptService.getAll().subscribe({
      next: p => this.departments.set(p.content ?? [])
    });

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 0; this.load(); });

    this.load();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filter: EmployeeFilter = {
      page:    this.currentPage,
      size:    this.pageSize,
      search:  this.searchCtrl.value ?? undefined,
      departmentId: this.selectedDept || undefined,
      divisionId:   this.selectedDiv  || undefined,
      status:  this.selectedStatus || undefined,
      sort:    this.sortField,
      direction: this.sortDir
    };

    this.empService.getAll(filter).subscribe({
      next:  p  => { this.page.set(p);  this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 0
          ? 'Cannot connect to server.'
          : `Failed to load employees (HTTP ${err.status}).`);
        this.isLoading.set(false);
      }
    });
  }

  // ── Modal actions ─────────────────────────────────────────────────────────
  openAdd(): void {
    this.empForm.reset({ firstName: '', lastName: '', employeeNumber: '', email: '',
      phone: '', departmentId: null, divisionId: null, positionId: null,
      startDate: new Date().toISOString().slice(0, 10), status: 'ACTIVE' });
    this.modalDivisions.set([]);
    this.modalPositions.set([]);
    // Load all positions upfront
    this.posService.getAll().subscribe({ next: p => this.modalPositions.set(p) });
    this.showAddModal.set(true);
  }

  closeAdd(): void { this.showAddModal.set(false); }

  onModalDeptChange(): void {
    const deptId = this.empForm.get('departmentId')?.value;
    this.empForm.patchValue({ divisionId: null, positionId: null });
    this.modalDivisions.set([]);
    this.modalPositions.set([]);
    if (deptId) {
      this.divService.getAll(deptId).subscribe({ next: d => this.modalDivisions.set(d) });
      this.posService.getAll().subscribe({ next: p => {
        // Filter positions that belong to this dept (if departmentId is present)
        const filtered = p.filter(pos => !pos.departmentId || pos.departmentId === deptId);
        this.modalPositions.set(filtered.length ? filtered : p);
      } });
    } else {
      this.posService.getAll().subscribe({ next: p => this.modalPositions.set(p) });
    }
  }

  onModalDivChange(): void {
    const divId = this.empForm.get('divisionId')?.value;
    this.empForm.patchValue({ positionId: null });
    if (divId) {
      this.posService.getAll(divId).subscribe({ next: p => this.modalPositions.set(p) });
    } else {
      const deptId = this.empForm.get('departmentId')?.value;
      this.posService.getAll().subscribe({ next: p => {
        const filtered = p.filter(pos => !pos.departmentId || pos.departmentId === (deptId ?? undefined));
        this.modalPositions.set(filtered.length ? filtered : p);
      } });
    }
  }

  saveEmployee(): void {
    if (this.empForm.invalid) { this.empForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.empForm.value;
    this.empService.create({
      firstName:      v.firstName!,
      lastName:       v.lastName!,
      employeeNumber: v.employeeNumber!,
      email:          v.email!,
      phone:          v.phone || undefined,
      positionId:     v.positionId!,
      startDate:      v.startDate!,
      status:         (v.status as any) ?? 'ACTIVE',
    }).subscribe({
      next: emp => {
        this.isSaving.set(false);
        this.showAddModal.set(false);
        this.toast.success('Employee added', `${emp.firstName} ${emp.lastName} has been added.`);
        this.load();
      },
      error: err => {
        this.isSaving.set(false);
        const msg = err.error?.message ?? `HTTP ${err.status}`;
        this.toast.error('Failed to add employee', msg);
      }
    });
  }

  fieldError(name: string): boolean {
    const c = this.empForm.get(name);
    return !!(c?.invalid && c.touched);
  }

  // ── Filter actions ────────────────────────────────────────────────────────
  onDeptChange(event: Event): void {
    this.selectedDept = Number((event.target as HTMLSelectElement).value);
    this.selectedDiv  = 0;
    this.divisions.set([]);
    if (this.selectedDept) {
      this.divService.getAll(this.selectedDept).subscribe({
        next: divs => this.divisions.set(divs)
      });
    }
    this.currentPage = 0;
    this.load();
  }

  onDivChange(event: Event): void {
    this.selectedDiv = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 0;
    this.load();
  }

  onStatusChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 0;
    this.load();
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'asc';
    }
    this.load();
  }

  goToPage(p: number): void { this.currentPage = p; this.load(); }
  viewEmp(id: number): void { this.router.navigate(['/employees', id]); }

  clearSearch(): void {
    this.searchCtrl.setValue('');
    this.selectedDept   = 0;
    this.selectedDiv    = 0;
    this.selectedStatus = '';
    this.currentPage    = 0;
    this.load();
  }

  scoreColor(s?: number): string {
    if (!s) return 'gray';
    if (s >= 90) return 'green'; if (s >= 75) return 'blue';
    if (s >= 60) return 'orange'; return 'red';
  }
  scoreClass(s?: number): string {
    if (!s) return 'none';
    if (s >= 90) return 'excellent'; if (s >= 75) return 'good';
    if (s >= 60) return 'average'; return 'poor';
  }
  statusBadge(status: string): string {
    if (status === 'ACTIVE')    return 'badge-success';
    if (status === 'SUSPENDED') return 'badge-danger';
    return 'badge-gray';
  }
  getInitials(name: string): string {
    const p = name.split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }
  sortIcon(field: string): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
}
