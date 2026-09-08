import {
  Component, OnInit, inject, signal, computed, ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService }   from '../../services/review.service';
import { ApprovalService } from '../../services/approval.service';
import { AuthService }     from '../../../../core/auth/auth.service';
import { PerformanceService } from '../../../performance/services/performance.service';
import { PerformanceRecord }  from '../../../performance/models/performance-record.model';
import { PerformanceReview, ReviewKpiItem, ReviewComment, WorkflowStep } from '../../models/performance-review';
import { ReviewDetailResponse }                            from '../../models/review-request.model';
import { PerformanceRating, suggestRating, ratingLabel } from '../../models/performance-rating';
import { ReviewWorkflow }   from '../../components/review-workflow/review-workflow';
import { ReviewScore }      from '../../components/review-score/review-score';
import { ReviewAssessment } from '../../components/review-assessment/review-assessment';
import { ApprovalActions }  from '../../components/approval-actions/approval-actions';
import { EvidencePanel }    from '../../components/evidence-panel/evidence-panel';
import { ReviewComments }   from '../../components/review-comments/review-comments';

type DialogMode = 'approve' | 'reject' | 'revision' | null;

@Component({
  selector: 'app-review-workspace',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    ReviewWorkflow, ReviewScore, ReviewAssessment,
    ApprovalActions, EvidencePanel, ReviewComments,
  ],
  templateUrl: './review-workspace.html',
  styleUrl: './review-workspace.css',
})
export class ReviewWorkspace implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private reviewSvc   = inject(ReviewService);
  private approvalSvc = inject(ApprovalService);
  private perfSvc     = inject(PerformanceService);
  private auth        = inject(AuthService);

  @ViewChild(ReviewAssessment) assessment!: ReviewAssessment;

  review       = signal<PerformanceReview | null>(null);
  reviewDetail = signal<ReviewDetailResponse | null>(null);
  /** Performance records keyed by id — populated after detail loads */
  perfRecords  = signal<Map<number, PerformanceRecord>>(new Map());
  isLoading    = signal(true);
  isSaving     = signal(false);
  error        = signal<string | null>(null);
  actionError  = signal<string | null>(null);

  /** Map raw backend status → WorkflowStep understood by the stepper component */
  private static readonly STATUS_TO_STEP: Record<string, WorkflowStep> = {
    OPEN:                       'MANAGER_REVIEW',
    MANAGER_ASSESSED:           'DIRECTOR_REVIEW',
    DIRECTOR_ASSESSED:          'HR_MODERATION',
    HR_MODERATED:               'MUNICIPAL_MANAGER',
    MUNICIPAL_MANAGER_APPROVED: 'FINALISED',
    FINALISED:                  'FINALISED',
    LOCKED:                     'LOCKED',
  };

  workflowStep = computed<WorkflowStep>(() => {
    const rawStatus = this.reviewDetail()?.status as string | undefined;
    return (rawStatus && ReviewWorkspace.STATUS_TO_STEP[rawStatus])
      ? ReviewWorkspace.STATUS_TO_STEP[rawStatus]
      : (this.review()?.currentStep ?? 'EMPLOYEE_SUBMISSION');
  });

  /** True when the review has reached a terminal state and no further actions are possible */
  isReviewComplete = computed<boolean>(() => {
    const s = this.reviewDetail()?.status as string | undefined;
    const step = this.workflowStep();
    return ['FINALISED', 'LOCKED'].includes(s ?? '') || ['FINALISED', 'LOCKED'].includes(step);
  });

  /** Best available score: overallScore → managerScore → avg of rating baseScores */
  displayScore = computed<number | null>(() => {
    const d = this.reviewDetail();
    const r = this.review();
    if (d?.overallScore != null) return d.overallScore;
    if (r?.overallScore  != null) return r.overallScore;
    if (d?.managerScore  != null) return d.managerScore;
    const bases = (d?.ratings ?? []).map(rt => rt.baseScore).filter((s): s is number => s != null);
    if (bases.length > 0) return Math.round(bases.reduce((a, b) => a + b, 0) / bases.length * 10) / 10;
    return null;
  });

  /**
   * Aggregate all comments from every workflow stage:
   *   - native review.comments (employee/system messages)
   *   - reviewDetail.approvals[].comments  (manager, director, HR, municipal manager notes)
   *   - reviewDetail.ratings[].managerComment / directorComment / hrComment
   */
  allComments = computed<ReviewComment[]>(() => {
    const result: ReviewComment[] = [];
    let nextId = 1;

    // Native comments from the review object
    for (const c of this.review()?.comments ?? []) {
      result.push(c);
      nextId = Math.max(nextId, (c.id ?? 0) + 1);
    }

    const d = this.reviewDetail();

    // Approval-level comments (one per workflow stage that has a comment)
    for (const ap of d?.approvals ?? []) {
      if (!ap.comments?.trim()) continue;
      const roleLabel: Record<string, string> = {
        MANAGER: 'Manager', DIRECTOR: 'Director',
        HR_MODERATOR: 'HR Moderator', MUNICIPAL_MANAGER: 'Municipal Manager',
      };
      result.push({
        id:         nextId++,
        authorName: ap.approvedByName ?? ap.approvedByEmail ?? ap.approvalLevel,
        authorRole: roleLabel[ap.approvalLevel] ?? ap.approvalLevel,
        content:    ap.comments,
        createdAt:  ap.actedAt ?? ap.createdAt,
      });
    }

    // Per-KPI rating comments (manager/director/HR)
    for (const rt of d?.ratings ?? []) {
      const pairs: Array<{ text?: string; role: string }> = [
        { text: rt.managerComment,  role: 'Manager'      },
        { text: rt.directorComment, role: 'Director'     },
        { text: rt.hrComment,       role: 'HR Moderator' },
      ];
      for (const { text, role } of pairs) {
        if (!text?.trim()) continue;
        // Avoid duplicating if already captured from approvals
        const isDup = result.some(c => c.authorRole === role && c.content === text);
        if (!isDup) {
          result.push({ id: nextId++, authorName: role, authorRole: role, content: text });
        }
      }
    }

    // Sort by createdAt ascending (undefined values go last)
    return result.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  dialogMode   = signal<DialogMode>(null);
  dialogReason = '';

  // ── Computed helpers ────────────────────────────────────────
  suggestedRating = computed<PerformanceRating | null>(() => {
    const s = this.review()?.overallScore;
    return s != null ? suggestRating(s) : null;
  });

  get kpiItems(): ReviewKpiItem[] { return this.review()?.kpiItems ?? []; }
  get comments(): ReviewComment[] { return this.review()?.comments ?? []; }

  /**
   * KPI table items: prefer review.kpiItems; fall back to mapping
   * reviewDetail.ratings joined with fetched performance records.
   */
  kpiTableItems = computed<ReviewKpiItem[]>(() => {
    const native = this.review()?.kpiItems ?? [];
    if (native.length > 0) return native;

    const recs = this.perfRecords();
    return (this.reviewDetail()?.ratings ?? []).map(rt => {
      const rec = recs.get(rt.performanceRecordId);
      return {
        kpiId:          rt.assignmentId,
        kpiName:        rt.kpiDefinitionName,
        kpiCode:        rt.kpiDefinitionCode,
        categoryName:   rec?.categoryName  ?? undefined,
        unit:           rec?.unit          ?? undefined,
        weight:         rec?.weight        ?? undefined,
        targetValue:    rec?.targetValue   ?? undefined,
        actualValue:    rec?.actualValue   ?? undefined,
        achievementPct: rec?.achievementPct ?? undefined,
        score:          rt.baseScore ?? rt.finalRating ?? rec?.score ?? undefined,
      } as ReviewKpiItem;
    });
  });

  /** Check both roles and permissions arrays (backend may put authority in either) */
  private hasAuthority(...keys: string[]): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    const all = new Set([...(user.roles ?? []), ...(user.permissions ?? [])]);
    return keys.some(k => all.has(k));
  }

  /** Role-based action permissions */
  get canApprove():         boolean { return this.hasAuthority('REVIEW_APPROVE', 'MANAGER', 'DIRECTOR', 'HR', 'MUNICIPAL_MANAGER', 'ADMIN', 'ROLE_ADMIN'); }
  get canReject():          boolean { return this.hasAuthority('REVIEW_REJECT',  'MANAGER', 'DIRECTOR', 'HR', 'MUNICIPAL_MANAGER', 'ADMIN', 'ROLE_ADMIN'); }
  get canRequestRevision(): boolean { return this.hasAuthority('REVIEW_REVISE',  'MANAGER', 'DIRECTOR', 'HR', 'ADMIN', 'ROLE_ADMIN'); }

  get approveLabel(): string {
    const roles = this.auth.currentUser()?.roles ?? [];
    const perms = this.auth.currentUser()?.permissions ?? [];
    const all   = [...roles, ...perms];
    if (all.includes('MUNICIPAL_MANAGER')) return 'Final Approval';
    if (all.includes('HR'))               return 'Confirm Assessment';
    return 'Approve';
  }

  get assessmentRoleLabel(): string {
    const roles = this.auth.currentUser()?.roles ?? [];
    const perms = this.auth.currentUser()?.permissions ?? [];
    const all   = [...roles, ...perms];
    if (all.includes('MUNICIPAL_MANAGER')) return 'Municipal Manager Assessment';
    if (all.includes('HR'))               return 'HR Moderation';
    if (all.includes('DIRECTOR'))         return 'Director Review';
    return 'Manager Assessment';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.loadReview(id);
  }

  private loadReview(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    // Load both the PerformanceReview shape (for the UI) and the
    // ReviewDetailResponse (for ratings/performanceRecordIds needed on submit)
    this.reviewSvc.getById(id).subscribe({
      next:  r  => { this.review.set(r); this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 404 ? 'Review not found.' : `Failed to load (HTTP ${err.status}).`);
        this.isLoading.set(false);
      },
    });
    this.reviewSvc.getDetail(id).subscribe({
      next: d => {
        this.reviewDetail.set(d);
        // Fetch the performance record(s) so we can show Target / Actual / Achievement
        const ids = [...new Set(d.ratings.map(r => r.performanceRecordId).filter(Boolean))];
        if (ids.length > 0) {
          const map = new Map<number, PerformanceRecord>();
          let remaining = ids.length;
          for (const rid of ids) {
            this.perfSvc.getById(rid).subscribe({
              next: rec => {
                map.set(rec.id, rec);
                if (--remaining === 0) this.perfRecords.set(new Map(map));
              },
              error: () => { if (--remaining === 0) this.perfRecords.set(new Map(map)); },
            });
          }
        }
      },
    });
  }

  // ── Actions ─────────────────────────────────────────────────
  openDialog(mode: DialogMode): void {
    this.dialogMode.set(mode);
    this.dialogReason = '';
    this.actionError.set(null);
  }

  closeDialog(): void {
    this.dialogMode.set(null);
    this.dialogReason = '';
  }

  confirmAction(): void {
    const id  = this.review()?.id;
    if (!id) return;

    const mode = this.dialogMode();
    this.isSaving.set(true);
    this.actionError.set(null);
    // Use the raw backend status from reviewDetail (e.g. MANAGER_ASSESSED, DIRECTOR_ASSESSED)
    // to determine the correct workflow endpoint, not the mapped frontend currentStep.
    const backendStatus = (this.reviewDetail()?.status ?? this.review()?.currentStep) as string | undefined;

    if (mode === 'approve') {
      const req    = this.assessment?.getValue() ?? {};
      // Get performance record IDs from the detail response ratings,
      // falling back to the singular performanceRecordId on the review object
      const detailRatings = this.reviewDetail()?.ratings ?? [];
      const perfRecordIds = detailRatings.length > 0
        ? detailRatings.map(r => r.performanceRecordId)
        : (this.review()?.performanceRecordId ? [this.review()!.performanceRecordId!] : []);

      this.approvalSvc.approve(id, req, perfRecordIds, backendStatus).subscribe({
        next:  () => this.afterAction(),
        error: err => this.handleActionError(err),
      });
    } else if (mode === 'reject') {
      if (!this.dialogReason.trim()) { this.actionError.set('A rejection reason is required.'); this.isSaving.set(false); return; }
      this.approvalSvc.reject(id, { reason: this.dialogReason }, backendStatus).subscribe({
        next:  () => this.afterAction(),
        error: err => this.handleActionError(err),
      });
    } else if (mode === 'revision') {
      if (!this.dialogReason.trim()) { this.actionError.set('Please describe what needs to be revised.'); this.isSaving.set(false); return; }
      this.approvalSvc.requestRevision(id, { comment: this.dialogReason }, backendStatus).subscribe({
        next:  () => this.afterAction(),
        error: err => this.handleActionError(err),
      });
    }
  }

  private afterAction(): void {
    this.isSaving.set(false);
    this.closeDialog();
    this.router.navigate(['/reviews']);
  }

  private handleActionError(err: any): void {
    this.actionError.set(err.error?.message ?? `Action failed (HTTP ${err.status}).`);
    this.isSaving.set(false);
  }

  // ── Helpers ─────────────────────────────────────────────────
  achievementColor(pct?: number | null): string {
    if (pct == null) return 'gray';
    if (pct >= 100) return 'green';
    if (pct >= 75)  return 'blue';
    if (pct >= 50)  return 'orange';
    return 'red';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }

  ratingLabel = ratingLabel;

  goBack(): void { this.router.navigate(['/reviews']); }
}



