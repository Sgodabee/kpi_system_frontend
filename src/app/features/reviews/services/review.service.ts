import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PerformanceReview, ReviewFilter,
} from '../models/performance-review';
import {
  ReviewDetailResponse, ReviewResponse, ApprovalResponse,
  ManagerAssessmentRequest, DirectorAssessmentRequest,
  HrModerationRequest, MunicipalManagerApprovalRequest,
  LockReviewRequest, FinaliseReviewRequest, CreateReviewRequest,
} from '../models/review-request.model';
import { WorkflowHistoryItem } from '../models/performance-outcome';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiV1}/reviews`;

  /**
   * GET /api/v1/reviews — maps backend ReviewResponse[] → PerformanceReview[].
   * Backend only supports GET at /reviews/year/{year}, so we use that.
   */
  getAll(filter: ReviewFilter = {}): Observable<PerformanceReview[]> {
    const year = filter.year ?? new Date().getFullYear();
    return this.http.get<ReviewResponse[]>(`${this.base}/year/${year}`).pipe(
      map(list => list.map(r => this.mapToPerformanceReview(r)))
    );
  }

  /** Map backend ReviewResponse → PerformanceReview (for the inbox UI) */
  private mapToPerformanceReview(r: ReviewResponse): PerformanceReview {
    const statusMap: Record<string, any> = {
      OPEN:                       'PENDING',
      MANAGER_ASSESSED:           'IN_PROGRESS',
      DIRECTOR_ASSESSED:          'IN_PROGRESS',
      HR_MODERATED:               'IN_PROGRESS',
      MUNICIPAL_MANAGER_APPROVED: 'APPROVED',
      FINALISED:                  'APPROVED',
      LOCKED:                     'APPROVED',
    };
    const stepMap: Record<string, any> = {
      OPEN:                       'MANAGER_REVIEW',
      MANAGER_ASSESSED:           'DIRECTOR_REVIEW',
      DIRECTOR_ASSESSED:          'HR_MODERATION',
      HR_MODERATED:               'MUNICIPAL_MANAGER',
      MUNICIPAL_MANAGER_APPROVED: 'FINALISED',
      FINALISED:                  'FINALISED',
      LOCKED:                     'LOCKED',
    };
    return {
      id:            r.id,
      employeeId:    r.employeeId,
      employeeName:  r.employeeName,
      employeeNumber:r.employeeNumber,
      departmentName: r.departmentName ?? '',   // populated from API response
      overallScore:  r.overallScore,
      status:        statusMap[r.status] ?? 'PENDING',
      currentStep:   stepMap[r.status]  ?? 'MANAGER_REVIEW',
      submittedAt:   r.createdAt,
    };
  }

  /** GET /api/v1/reviews/{id} — returns full detail including ratings */
  getById(id: number) {
    return this.http.get<PerformanceReview>(`${this.base}/${id}`);
  }

  /**
   * GET /api/v1/reviews/{id} cast to ReviewDetailResponse so the workspace
   * can access ratings[].performanceRecordId for the assessment submission.
   */
  getDetail(id: number) {
    return this.http.get<ReviewDetailResponse>(`${this.base}/${id}`);
  }

  /** Delegates to getAll() using the given year */
  getByYear(year: number) {
    return this.getAll({ year });
  }

  /** GET /api/v1/reviews/employee/{employeeId} */
  getByEmployee(employeeId: number) {
    return this.http.get<ReviewResponse[]>(`${this.base}/employee/${employeeId}`).pipe(
      map(list => list.map(r => this.mapToPerformanceReview(r)))
    );
  }

  /** GET /api/v1/reviews/{id}/outcome */
  getOutcome(id: number) {
    return this.http.get<any>(`${this.base}/${id}/outcome`);
  }

  /** GET /api/v1/reviews/{id}/approvals */
  getApprovals(id: number) {
    return this.http.get<ApprovalResponse[]>(`${this.base}/${id}/approvals`);
  }

  /**
   * GET /api/v1/reviews/{id}/approvals — mapped to WorkflowHistoryItem[]
   */
  getHistory(id: number) {
    return this.getApprovals(id).pipe(
      map((approvals: ApprovalResponse[]) =>
        approvals.map(a => ({
          step:      a.approvalLevel,
          stepLabel: a.approvalLevel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          actorName: a.approvedByName ?? a.approvedByEmail,
          actorRole: a.approvalLevel,
          action:    (a.action === 'RETURNED_FOR_REVISION' ? 'REVISION_REQUESTED' : a.action) as WorkflowHistoryItem['action'],
          comment:   a.comments,
          timestamp: a.actedAt,
        } as WorkflowHistoryItem))
      )
    );
  }

  /** POST /api/v1/reviews */
  create(request: CreateReviewRequest) {
    return this.http.post<ReviewResponse>(this.base, request);
  }

  // ── Workflow step actions ────────────────────────────────────────────────

  /** POST /api/v1/reviews/{id}/manager-assessment */
  submitManagerAssessment(id: number, request: ManagerAssessmentRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/manager-assessment`, request);
  }

  /** POST /api/v1/reviews/{id}/director-assessment */
  submitDirectorAssessment(id: number, request: DirectorAssessmentRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/director-assessment`, request);
  }

  /** POST /api/v1/reviews/{id}/hr-moderation */
  submitHrModeration(id: number, request: HrModerationRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/hr-moderation`, request);
  }

  /** POST /api/v1/reviews/{id}/municipal-approval */
  submitMunicipalApproval(id: number, request: MunicipalManagerApprovalRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/municipal-approval`, request);
  }

  /** POST /api/v1/reviews/{id}/lock */
  lock(id: number, request: LockReviewRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/lock`, request);
  }

  /** POST /api/v1/reviews/{id}/finalise */
  finalise(id: number, request: FinaliseReviewRequest) {
    return this.http.post<ReviewDetailResponse>(`${this.base}/${id}/finalise`, request);
  }

  // ── Convenience helpers ──────────────────────────────────────────────────

  getInbox(filter: ReviewFilter = {}) {
    return this.getAll(filter);
  }

  /** Stats — no dedicated API endpoint exists; returns safe zeros. */
  getStats(): Observable<{ pending: number; overdue: number }> {
    return of({ pending: 0, overdue: 0 });
  }
}


