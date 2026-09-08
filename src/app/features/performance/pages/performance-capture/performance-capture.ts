import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerformanceService }    from '../../services/performance.service';
import { EvidenceService }       from '../../services/evidence.service';
import { AuthService }           from '../../../../core/auth/auth.service';
import { KpiAssignmentService }  from '../../../../core/services/kpi-assignment.service';
import { PerformanceRecord, KpiDataType, KpiDirection } from '../../models/performance-record.model';
import { PerformanceEvidence }   from '../../models/performance-evidence.model';
import { KpiAssignment }         from '../../../../core/models/kpi-assignment.model';
import { KpiValueInput }         from '../../components/kpi-value-input/kpi-value-input';
import { EvidenceUploader }      from '../../components/evidence-uploader/evidence-uploader';

@Component({
  selector: 'app-performance-capture',
  standalone: true,
  imports: [FormsModule, RouterLink, KpiValueInput, EvidenceUploader],
  templateUrl: './performance-capture.html',
  styleUrl: './performance-capture.css'
})
export class PerformanceCapture implements OnInit {
  private route             = inject(ActivatedRoute);
  private perfService       = inject(PerformanceService);
  private evidService       = inject(EvidenceService);
  private authService       = inject(AuthService);
  private assignmentService = inject(KpiAssignmentService);
  private router            = inject(Router);
  private location          = inject(Location);

  record    = signal<PerformanceRecord | null>(null);
  evidence  = signal<PerformanceEvidence[]>([]);
  isLoading = signal(true);
  isSaving  = signal(false);
  isSubmitting = signal(false);
  error     = signal<string | null>(null);
  saveError = signal<string | null>(null);

  // Available assignments for selection (new capture flow)
  assignments         = signal<KpiAssignment[]>([]);
  assignmentsLoading  = signal(false);
  selectedAssignmentId = signal<number | null>(null);

  // Form fields
  actualValue   = signal<number | null>(null);
  actualText    = signal<string | null>(null);
  actualBoolean = signal<boolean | null>(null);
  comment       = signal('');

  // Is this creating new (no record yet) or editing existing?
  isNew = false;
  assignmentId:  number | null = null;
  departmentId:  number | null = null;  // optional dept context passed via query param

  // Selected assignment details (for showing KPI info on new capture)
  selectedAssignment = computed<KpiAssignment | null>(() => {
    const id = this.selectedAssignmentId();
    if (!id) return null;
    return this.assignments().find(a => a.id === id) ?? null;
  });

  // ── Computed scores ────────────────────────────────────────
  achievementPct = computed<number | null>(() => {
    const r = this.record();
    if (!r?.targetValue || r.targetValue === 0) return null;
    const val = this.actualValue();
    if (val == null) return null;
    const direction = r.kpiDirection ?? 'HIGHER_IS_BETTER';
    if (direction === 'HIGHER_IS_BETTER') {
      return Math.round((val / r.targetValue) * 1000) / 10;
    } else if (direction === 'LOWER_IS_BETTER') {
      if (val === 0) return 100;
      return Math.round((r.targetValue / val) * 1000) / 10;
    }
    // TARGET_EXACT
    const diff = Math.abs(val - r.targetValue);
    return Math.max(0, Math.round((1 - diff / r.targetValue) * 1000) / 10);
  });

  score = computed<number | null>(() => {
    const ach = this.achievementPct();
    if (ach == null) return null;
    const w = this.record()?.weight ?? 100;
    return Math.min(100, Math.round(ach * w) / 100);
  });

  get scoreColor(): string {
    const s = this.score();
    if (s == null) return 'gray';
    if (s >= 90) return 'green'; if (s >= 75) return 'blue';
    if (s >= 50) return 'orange'; return 'red';
  }

  ngOnInit(): void {
    const id          = this.route.snapshot.params['id'];
    const qAssignment = this.route.snapshot.queryParams['assignmentId'];
    const qDept       = this.route.snapshot.queryParams['departmentId'];
    this.isNew         = !id || id === 'new';
    this.assignmentId  = qAssignment ? Number(qAssignment) : null;
    this.departmentId  = qDept       ? Number(qDept)       : null;

    if (!this.isNew) {
      this.loadRecord(Number(id));
    } else {
      this.isLoading.set(false);
      // Load active assignments so user can pick one
      this.loadAssignments();
      if (this.assignmentId) {
        this.selectedAssignmentId.set(this.assignmentId);
      }
    }
  }

  private loadAssignments(): void {
    this.assignmentsLoading.set(true);
    const currentUser = this.authService.currentUser();
    const employeeId  = currentUser?.employeeId;

    if (this.departmentId) {
      // Navigated from a department page — show only that department's active KPIs
      this.assignmentService.getAll({ departmentId: this.departmentId, status: 'ACTIVE' }).subscribe({
        next: list => {
          if (list.length > 0) {
            this.assignments.set(list);
          } else {
            // Include DRAFT too if no ACTIVE found for this dept
            this.assignmentService.getAll({ departmentId: this.departmentId! }).subscribe({
              next: all => this.assignments.set(all.filter(a => a.status === 'ACTIVE' || a.status === 'DRAFT')),
              error: () => {},
            });
          }
          this.assignmentsLoading.set(false);
        },
        error: () => this.assignmentsLoading.set(false),
      });
    } else if (employeeId) {
      // Regular employee — show their own ACTIVE assignments
      this.assignmentService.getAll({ assigneeType: 'EMPLOYEE', assigneeId: employeeId, status: 'ACTIVE' }).subscribe({
        next: list => {
          if (list.length > 0) {
            this.assignments.set(list);
            this.assignmentsLoading.set(false);
          } else {
            // Fallback: include DRAFT
            this.assignmentService.getAll({ assigneeType: 'EMPLOYEE', assigneeId: employeeId }).subscribe({
              next:  all => { this.assignments.set(all.filter(a => a.status === 'ACTIVE' || a.status === 'DRAFT')); this.assignmentsLoading.set(false); },
              error: ()  => this.assignmentsLoading.set(false),
            });
          }
        },
        error: () => this.assignmentsLoading.set(false),
      });
    } else {
      // Admin / no employee context — load all active assignments
      this.assignmentService.getAll({ status: 'ACTIVE' }).subscribe({
        next: list => {
          this.assignments.set(list);
          this.assignmentsLoading.set(false);
        },
        error: () => this.assignmentsLoading.set(false),
      });
    }
  }

  private loadRecord(id: number): void {
    this.isLoading.set(true);
    this.perfService.getById(id).subscribe({
      next: r => {
        this.record.set(r);
        this.actualValue.set(r.actualValue ?? null);
        this.actualText.set(r.actualText ?? null);
        this.comment.set(r.comment ?? '');
        this.isLoading.set(false);
        this.loadEvidence(id);
      },
      error: err => {
        this.error.set(err.status === 404 ? 'Record not found.' : 'Failed to load.');
        this.isLoading.set(false);
      }
    });
  }

  private loadEvidence(id: number): void {
    this.evidService.getByRecord(id).subscribe({
      next: ev => this.evidence.set(ev)
    });
  }

  saveDraft(): void {
    this.isSaving.set(true);
    this.saveError.set(null);
    const data = this.buildRequest();
    const obs$ = this.record()
      ? this.perfService.update(this.record()!.id, data)
      : this.perfService.create(data);

    obs$.subscribe({
      next: r => {
        this.record.set(r);
        this.isSaving.set(false);
        if (!this.record()) this.router.navigate(['/performance', r.id, 'edit'], { replaceUrl: true });
      },
      error: err => {
        this.saveError.set(`Save failed (HTTP ${err.status}). Please try again.`);
        this.isSaving.set(false);
      }
    });
  }

  submitRecord(): void {
    if (!this.record()) { this.saveDraft(); return; }
    this.isSubmitting.set(true);
    this.saveError.set(null);

    // Save latest values first, then submit
    this.perfService.update(this.record()!.id, this.buildRequest()).subscribe({
      next: () => {
        this.perfService.submit(this.record()!.id, this.authService.currentUser()?.id ?? 0).subscribe({
          next: r => {
            this.record.set(r);
            this.isSubmitting.set(false);
            this.router.navigate(['/performance', r.id]);
          },
          error: err => {
            this.saveError.set(`Submit failed (HTTP ${err.status}). Please try again.`);
            this.isSubmitting.set(false);
          }
        });
      },
      error: err => {
        this.saveError.set(`Save failed (HTTP ${err.status}).`);
        this.isSubmitting.set(false);
      }
    });
  }

  private buildRequest() {
    const aId = this.isNew
      ? (this.selectedAssignmentId() ?? undefined)
      : (this.assignmentId ?? undefined);
    return {
      assignmentId: aId,
      actualValue:  this.actualValue() ?? 0,
      notes:        this.actualText() ?? this.comment() ?? undefined,
    };
  }

  get effectiveAssignmentId(): number | null {
    return this.isNew ? this.selectedAssignmentId() : this.assignmentId;
  }

  get canSave(): boolean {
    return !!this.effectiveAssignmentId;
  }

  onEvidenceUploaded(ev: PerformanceEvidence): void {
    this.evidence.update(list => [...list, ev]);
  }
  onEvidenceDeleted(id: number): void {
    this.evidence.update(list => list.filter(e => e.id !== id));
  }

  goBack(): void { this.location.back(); }

  get dataType(): KpiDataType { return (this.record()?.kpiDataType ?? 'NUMBER') as KpiDataType; }
  get isReadyToSubmit(): boolean {
    if (this.dataType === 'TEXT') return !!(this.actualText()?.trim());
    return this.actualValue() != null;
  }
}

