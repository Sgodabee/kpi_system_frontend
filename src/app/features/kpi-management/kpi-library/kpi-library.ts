import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TitleCasePipe } from '@angular/common';
import { KpiService }         from '../../../core/services/kpi.service';
import { KpiCategoryService } from '../../../core/services/kpi-category.service';
import { AuthService }        from '../../../core/auth/auth.service';
import { ToastService }       from '../../../core/services/toast.service';
import { Kpi, KpiCategory, KpiFilter, KpiType, KpiStatus, KpiRequest } from '../../../core/models/kpi.model';
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-kpi-library',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, TitleCasePipe],
  templateUrl: './kpi-library.html',
  styleUrl:    './kpi-library.css'
})
export class KpiLibrary implements OnInit, OnDestroy {
  private kpiService      = inject(KpiService);
  private categoryService = inject(KpiCategoryService);
  private authService     = inject(AuthService);
  private toast           = inject(ToastService);
  private router          = inject(Router);
  private destroy$        = new Subject<void>();

  page       = signal<Page<Kpi> | null>(null);
  categories = signal<KpiCategory[]>([]);
  isLoading  = signal(true);
  error      = signal<string | null>(null);

  searchCtrl       = new FormControl('');
  selectedCategory = 0;
  selectedType     = '';
  selectedStatus   = 'ACTIVE';
  currentPage      = 0;
  pageSize         = 25;
  sortField        = 'name';
  sortDir: 'asc'|'desc' = 'asc';

  // ── Create / Edit modal ─────────────────────────────────────────────────
  showModal   = signal(false);
  isSaving    = signal(false);
  editingId   = signal<number | null>(null);

  kpiForm = new FormGroup({
    name:        new FormControl('', [Validators.required, Validators.minLength(2)]),
    code:        new FormControl(''),
    description: new FormControl(''),
    categoryId:  new FormControl<number | null>(null),
    type:        new FormControl<KpiType>('QUANTITATIVE', Validators.required),
    unit:        new FormControl(''),
    frequency:   new FormControl('MONTHLY'),
    targetValue: new FormControl<number | null>(null),
    weight:      new FormControl<number | null>(null),
    status:      new FormControl<KpiStatus>('DRAFT'),
  });

  get kpis():       Kpi[]    { return this.page()?.content ?? []; }
  get total():      number   { return this.page()?.totalElements ?? 0; }
  get totalPages(): number   { return this.page()?.totalPages ?? 0; }
  get startItem():  number   { return this.currentPage * this.pageSize + 1; }
  get endItem():    number   { return Math.min((this.currentPage + 1) * this.pageSize, this.total); }

  get canManage(): boolean {
    return this.authService.hasAnyPermission(['ADMIN', 'KPI_MANAGE']);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages, cur = this.currentPage;
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    const end   = Math.min(total - 1, start + 4);
    if (start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get activeCount():  number { return this.categories().reduce((s, c) => s + (c.kpiCount ?? 0), 0); }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({ next: p => this.categories.set(p.content ?? []) });
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 0; this.load(); });
    this.load();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const filter: KpiFilter = {
      page: this.currentPage, size: this.pageSize,
      search:     this.searchCtrl.value ?? undefined,
      categoryId: this.selectedCategory || undefined,
      type:       this.selectedType   || undefined,
      status:     this.selectedStatus || undefined,
      sort:       this.sortField, direction: this.sortDir
    };
    this.kpiService.getAll(filter).subscribe({
      next:  p  => { this.page.set(p);  this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 0 ? 'Cannot connect to server.' : `Failed to load KPIs (HTTP ${err.status}).`);
        this.isLoading.set(false);
      }
    });
  }

  // ── Modal actions ──────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null);
    this.kpiForm.reset({
      name: '', code: '', description: '', categoryId: null,
      type: 'QUANTITATIVE', unit: '', frequency: 'MONTHLY',
      targetValue: null, weight: null, status: 'DRAFT'
    });
    this.showModal.set(true);
  }

  openEdit(kpi: Kpi, event: Event): void {
    event.stopPropagation();
    this.editingId.set(kpi.id);
    this.kpiForm.reset({
      name:        kpi.name,
      code:        kpi.code        ?? '',
      description: kpi.description ?? '',
      categoryId:  kpi.categoryId  ?? null,
      type:        kpi.type,
      unit:        kpi.unit        ?? '',
      frequency:   kpi.frequency   ?? 'MONTHLY',
      targetValue: kpi.targetValue ?? null,
      weight:      kpi.weight      ?? null,
      status:      kpi.status,
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveKpi(): void {
    if (this.kpiForm.invalid) { this.kpiForm.markAllAsTouched(); return; }
    this.isSaving.set(true);

    const v = this.kpiForm.value;
    const request: KpiRequest = {
      name:        v.name!,
      code:        v.code        || undefined,
      description: v.description || undefined,
      categoryId:  v.categoryId  ?? undefined,
      type:        v.type        as KpiType,
      unit:        v.unit        || undefined,
      frequency:   v.frequency   as any || undefined,
      targetValue: v.targetValue ?? undefined,
      weight:      v.weight      ?? undefined,
      status:      v.status      as KpiStatus || 'DRAFT',
    };

    const id = this.editingId();
    const obs$ = id
      ? this.kpiService.update(id, request)
      : this.kpiService.create(request);

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showModal.set(false);
        this.toast.success(id ? 'KPI updated' : 'KPI created', `"${request.name}" has been saved.`);
        this.load();
      },
      error: err => {
        this.isSaving.set(false);
        this.toast.error('Save failed', err.error?.message ?? `HTTP ${err.status}`);
      }
    });
  }

  deleteKpi(kpi: Kpi, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete "${kpi.name}"? This cannot be undone.`)) return;
    this.kpiService.delete(kpi.id).subscribe({
      next: () => { this.toast.success('KPI deleted', `"${kpi.name}" was removed.`); this.load(); },
      error: err => this.toast.error('Delete failed', err.error?.message ?? `HTTP ${err.status}`)
    });
  }

  // ── Filter / sort ──────────────────────────────────────────────────────
  onCategoryChange(e: Event): void { this.selectedCategory = Number((e.target as HTMLSelectElement).value); this.currentPage = 0; this.load(); }
  onTypeChange(e: Event):     void { this.selectedType = (e.target as HTMLSelectElement).value; this.currentPage = 0; this.load(); }
  onStatusChange(e: Event):   void { this.selectedStatus = (e.target as HTMLSelectElement).value; this.currentPage = 0; this.load(); }
  sort(field: string): void {
    this.sortDir = this.sortField === field ? (this.sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.sortField = field; this.load();
  }
  goToPage(p: number): void { this.currentPage = p; this.load(); }
  viewKpi(id: number):   void { this.router.navigate(['/kpis', id]); }
  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.selectedCategory = 0; this.selectedType = ''; this.selectedStatus = 'ACTIVE';
    this.currentPage = 0; this.load();
  }

  // ── Display helpers ────────────────────────────────────────────────────
  sortIcon(f: string): string { if (this.sortField !== f) return 'unfold_more'; return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'; }
  typeLabel(type: KpiType): string { return type === 'QUANTITATIVE' ? 'Quantitative' : 'Qualitative'; }
  typeBadge(type: KpiType): string { return type === 'QUANTITATIVE' ? 'badge-primary' : 'badge-purple'; }
  statusBadge(status: KpiStatus): string { return status === 'ACTIVE' ? 'badge-success' : status === 'DRAFT' ? 'badge-warning' : 'badge-gray'; }
  fieldError(name: string): boolean { const c = this.kpiForm.get(name); return !!(c?.invalid && c.touched); }
}




