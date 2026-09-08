import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReviewService }  from '../../../reviews/services/review.service';
import { AdminService }   from '../../../admin/services/admin.service';
import { AuthService }    from '../../../../core/auth/auth.service';
import { ToastService }   from '../../../../core/services/toast.service';
import { PerformanceReview } from '../../../reviews/models/performance-review';
import { SystemConfig }   from '../../../admin/models/admin.model';

export type WfTab = 'pipeline' | 'approval-chain' | 'escalation';

export interface PipelineStage {
  id:          string;
  label:       string;
  icon:        string;
  colorClass:  string;
  role:        string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'MANAGER_REVIEW',
    label: 'Manager Review',
    icon: 'manage_accounts',
    colorClass: 'stage-blue',
    role: 'Line Manager',
    description: 'Performance submitted — awaiting manager assessment',
  },
  {
    id: 'DIRECTOR_REVIEW',
    label: 'Director Review',
    icon: 'supervisor_account',
    colorClass: 'stage-indigo',
    role: 'Director',
    description: 'Manager assessed — awaiting director review',
  },
  {
    id: 'HR_MODERATION',
    label: 'HR Moderation',
    icon: 'how_to_reg',
    colorClass: 'stage-purple',
    role: 'HR Officer',
    description: 'Director reviewed — awaiting HR moderation',
  },
  {
    id: 'MUNICIPAL_MANAGER',
    label: 'Municipal Approval',
    icon: 'verified',
    colorClass: 'stage-amber',
    role: 'Municipal Manager',
    description: 'HR moderated — awaiting municipal manager approval',
  },
  {
    id: 'FINALISED',
    label: 'Finalised',
    icon: 'task_alt',
    colorClass: 'stage-green',
    role: '—',
    description: 'Review cycle complete',
  },
];

export interface ApprovalChainStep {
  order:       number;
  stage:       string;
  approver:    string;
  role:        string;
  action:      string;
  sla:         string;
  icon:        string;
}

const APPROVAL_CHAIN: ApprovalChainStep[] = [
  { order: 1, stage: 'Submit',           approver: 'Employee',         role: 'Employee',          action: 'Captures and submits performance data',               sla: 'Before deadline',   icon: 'person' },
  { order: 2, stage: 'Manager Review',   approver: 'Line Manager',     role: 'Manager',           action: 'Rates KPIs and provides written assessment',          sla: '5 business days',   icon: 'manage_accounts' },
  { order: 3, stage: 'Director Review',  approver: 'Director',         role: 'Director',          action: 'Validates and approves manager assessment',           sla: '5 business days',   icon: 'supervisor_account' },
  { order: 4, stage: 'HR Moderation',    approver: 'HR Officer',       role: 'HR',                action: 'Moderates scores for consistency across departments',  sla: '3 business days',   icon: 'how_to_reg' },
  { order: 5, stage: 'Municipal Sign-off', approver: 'Municipal Manager', role: 'Municipal Manager', action: 'Final approval and sign-off of all reviews',       sla: '5 business days',   icon: 'verified' },
  { order: 6, stage: 'Finalise',         approver: 'Administrator',    role: 'Admin',             action: 'Locks and archives the completed review record',      sla: 'Same day',          icon: 'lock' },
];

@Component({
  selector: 'app-workflow-centre',
  standalone: true,
  imports: [FormsModule, RouterLink, SlicePipe],
  templateUrl: './workflow-centre.html',
  styleUrl: './workflow-centre.css',
})
export class WorkflowCentre implements OnInit {
  private reviewSvc = inject(ReviewService);
  private adminSvc  = inject(AdminService);
  private authSvc   = inject(AuthService);
  private toast     = inject(ToastService);
  private router    = inject(Router);

  readonly STAGES = PIPELINE_STAGES;
  readonly CHAIN  = APPROVAL_CHAIN;

  activeTab    = signal<WfTab>('pipeline');
  isLoading    = signal(true);
  error        = signal<string | null>(null);

  reviews      = signal<PerformanceReview[]>([]);
  allReviews   = signal<PerformanceReview[]>([]);
  filterYear   = signal(new Date().getFullYear());

  // Escalation config
  escalationConfig = signal<{ reviewReminderDays: number; escalationAfterDays: number; sessionTimeoutMinutes: number }>({
    reviewReminderDays:    3,
    escalationAfterDays:   7,
    sessionTimeoutMinutes: 30,
  });
  isSavingEscalation = signal(false);

  // ── Computed pipeline stats ────────────────────────────────────────────────

  pipelineCounts = computed(() => {
    const rv = this.reviews();
    const counts: Record<string, number> = {};
    for (const s of PIPELINE_STAGES) counts[s.id] = 0;
    for (const r of rv) {
      if (r.currentStep && counts[r.currentStep] !== undefined) {
        counts[r.currentStep]++;
      }
    }
    return counts;
  });

  totalActive = computed(() =>
    this.reviews().filter(r => r.status !== 'APPROVED').length
  );

  totalFinalised = computed(() =>
    this.reviews().filter(r => r.currentStep === 'FINALISED').length
  );

  pendingCount = computed(() =>
    this.reviews().filter(r =>
      ['MANAGER_REVIEW', 'DIRECTOR_REVIEW', 'HR_MODERATION', 'MUNICIPAL_MANAGER'].includes(r.currentStep ?? '')
    ).length
  );

  // Reviews in the pipeline (not finalised) sorted by submission date
  activeReviews = computed(() =>
    this.reviews()
      .filter(r => r.currentStep !== 'FINALISED')
      .slice()
      .sort((a, b) => (a.submittedAt ?? '') < (b.submittedAt ?? '') ? 1 : -1)
  );

  reviewsForStage(stageId: string): PerformanceReview[] {
    return this.reviews().filter(r => r.currentStep === stageId);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    forkJoin({
      reviews: this.reviewSvc.getAll({ year: this.filterYear() }).pipe(catchError(() => of([]))),
      config:  this.adminSvc.getConfig().pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ reviews, config }) => {
        this.reviews.set(reviews as PerformanceReview[]);
        this.allReviews.set(reviews as PerformanceReview[]);
        this.parseConfig(config);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(`Failed to load workflow data (HTTP ${err.status})`);
        this.isLoading.set(false);
      }
    });
  }

  private parseConfig(config: Record<string, SystemConfig[]> | SystemConfig[]) {
    let flat: SystemConfig[] = [];
    if (Array.isArray(config)) {
      flat = config;
    } else {
      flat = Object.values(config).flat();
    }
    const get = (key: string, def: number) => {
      const v = flat.find(c => c.configKey === key)?.configValue;
      return v != null ? +v : def;
    };
    this.escalationConfig.set({
      reviewReminderDays:    get('reviewReminderDays',    3),
      escalationAfterDays:   get('escalationAfterDays',   7),
      sessionTimeoutMinutes: get('sessionTimeoutMinutes', 30),
    });
  }

  changeYear(): void { this.loadAll(); }

  setTab(tab: WfTab): void { this.activeTab.set(tab); }

  openReview(id: number): void { this.router.navigate(['/reviews', id]); }

  stageCount(stageId: string): number {
    return this.pipelineCounts()[stageId] ?? 0;
  }

  stepLabel(step: string): string {
    return PIPELINE_STAGES.find(s => s.id === step)?.label ?? step.replace(/_/g, ' ');
  }

  statusBadgeClass(status: string): string {
    return ({ PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', APPROVED: 'badge-success' }[status]) ?? 'badge-gray';
  }

  scoreColor(score?: number): string {
    if (!score) return '';
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-average';
    return 'score-poor';
  }

  // ── Escalation save ───────────────────────────────────────────────────────

  saveEscalation(): void {
    this.isSavingEscalation.set(true);
    const cfg = this.escalationConfig();
    const entries = [
      { configKey: 'reviewReminderDays',    configValue: String(cfg.reviewReminderDays),    dataType: 'INTEGER', category: 'WORKFLOW' },
      { configKey: 'escalationAfterDays',   configValue: String(cfg.escalationAfterDays),   dataType: 'INTEGER', category: 'WORKFLOW' },
      { configKey: 'sessionTimeoutMinutes', configValue: String(cfg.sessionTimeoutMinutes), dataType: 'INTEGER', category: 'SECURITY' },
    ];
    this.adminSvc.bulkUpdateConfig(entries).subscribe({
      next: () => {
        this.isSavingEscalation.set(false);
        this.toast.success('Saved', 'Escalation rules updated successfully.');
      },
      error: err => {
        this.isSavingEscalation.set(false);
        this.toast.error('Save failed', err.error?.message ?? `HTTP ${err.status}`);
      }
    });
  }

  updateEscalationField(field: 'reviewReminderDays' | 'escalationAfterDays' | 'sessionTimeoutMinutes', value: number): void {
    this.escalationConfig.update(c => ({ ...c, [field]: value }));
  }

  get canManage(): boolean {
    return this.authSvc.hasAnyPermission(['ADMIN']);
  }
}

