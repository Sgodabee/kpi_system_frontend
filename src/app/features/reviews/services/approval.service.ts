import { Injectable, inject } from '@angular/core';
import { ReviewService } from './review.service';
import { AuthService }  from '../../../core/auth/auth.service';
import {
  ManagerAssessmentRequest, RatingItem,
  DirectorAssessmentRequest,
  HrModerationRequest,
  MunicipalManagerApprovalRequest,
} from '../models/review-request.model';
import { ApprovalRequest, RejectionRequest, RevisionRequest } from '../models/performance-approval';

/** Map a PerformanceRating string to a 1-5 numeric score for the backend */
function ratingToScore(rating?: string): number {
  const map: Record<string, number> = {
    OUTSTANDING: 5, EXCEEDS_EXPECTATIONS: 4, MEETS_EXPECTATIONS: 3,
    NEEDS_IMPROVEMENT: 2, UNACCEPTABLE: 1,
  };
  return map[rating ?? ''] ?? 3;
}

/**
 * Thin façade over ReviewService for components that only need
 * approve / reject / requestRevision style operations.
 * Detects the current user's role and delegates to the correct API endpoint.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private reviewSvc = inject(ReviewService);
  private auth      = inject(AuthService);

  private get userId(): number { return this.auth.currentUser()?.id ?? 0; }

  private getRole(
    currentStep?: string,
  ): 'MUNICIPAL_MANAGER' | 'HR' | 'DIRECTOR' | 'MANAGER' {
    const all = [
      ...(this.auth.currentUser()?.roles       ?? []),
      ...(this.auth.currentUser()?.permissions ?? []),
    ];
    const isAdmin = all.some(r => ['ADMIN', 'ROLE_ADMIN'].includes(r));

    // For admins (or when no specific role matches), derive the step from
    // the review's current workflow position so the right endpoint is called.
    if (isAdmin && currentStep) {
      // Backend raw status values → required endpoint role
      // Note: MUNICIPAL_MANAGER_APPROVED is handled before getRole() is called (→ finalise)
      if (['HR_MODERATED', 'MUNICIPAL_MANAGER'].includes(currentStep))        return 'MUNICIPAL_MANAGER';
      if (['DIRECTOR_ASSESSED', 'HR_MODERATION'].includes(currentStep))       return 'HR';
      if (['MANAGER_ASSESSED', 'DIRECTOR_REVIEW'].includes(currentStep))      return 'DIRECTOR';
      return 'MANAGER'; // OPEN / MANAGER_REVIEW
    }

    if (all.some(r => ['MUNICIPAL_MANAGER', 'ROLE_MUNICIPAL_MANAGER'].includes(r))) return 'MUNICIPAL_MANAGER';
    if (all.some(r => ['HR', 'ROLE_HR', 'HR_MODERATOR', 'ROLE_HR_MODERATOR'].includes(r)))    return 'HR';
    if (all.some(r => ['DIRECTOR', 'ROLE_DIRECTOR'].includes(r)))                              return 'DIRECTOR';
    return 'MANAGER';
  }

  /** Approve — routes to the correct role-based endpoint */
  approve(id: number, req: ApprovalRequest = {}, performanceRecordIds: number[] = [], currentStep?: string) {
    const userId  = this.userId;
    const comment = req.comment;

    // MUNICIPAL_MANAGER_APPROVED → finalise the review
    if (currentStep === 'MUNICIPAL_MANAGER_APPROVED') {
      return this.reviewSvc.finalise(id, { createdById: userId, outcomeNotes: comment });
    }

    const role = this.getRole(currentStep);

    // Build a ratings array — one RatingItem per performance record
    const ratings: RatingItem[] = performanceRecordIds.map(perfRecordId => ({
      performanceRecordId: perfRecordId,
      managerRating:       ratingToScore(req.rating),
      managerComment:      comment,
    }));

    if (role === 'MUNICIPAL_MANAGER') {
      const body: MunicipalManagerApprovalRequest = { municipalManagerId: userId, action: 'APPROVED', comments: comment };
      return this.reviewSvc.submitMunicipalApproval(id, body);
    }
    if (role === 'HR') {
      const body: HrModerationRequest = { hrModeratorId: userId, action: 'APPROVED', comments: comment, ratings };
      return this.reviewSvc.submitHrModeration(id, body);
    }
    if (role === 'DIRECTOR') {
      const body: DirectorAssessmentRequest = { directorId: userId, action: 'APPROVED', comments: comment, ratings };
      return this.reviewSvc.submitDirectorAssessment(id, body);
    }
    const body: ManagerAssessmentRequest = { managerId: userId, comments: comment, ratings };
    return this.reviewSvc.submitManagerAssessment(id, body);
  }

  /** Reject — routes to the correct role-based endpoint */
  reject(id: number, req: RejectionRequest, currentStep?: string) {
    const role    = this.getRole(currentStep);
    const userId  = this.userId;
    const comment = req.reason ?? req.comment;

    if (role === 'MUNICIPAL_MANAGER') {
      return this.reviewSvc.submitMunicipalApproval(id, { municipalManagerId: userId, action: 'REJECTED', comments: comment });
    }
    if (role === 'HR') {
      return this.reviewSvc.submitHrModeration(id, { hrModeratorId: userId, action: 'REJECTED', comments: comment });
    }
    if (role === 'DIRECTOR') {
      return this.reviewSvc.submitDirectorAssessment(id, { directorId: userId, action: 'REJECTED', comments: comment });
    }
    return this.reviewSvc.submitManagerAssessment(id, { managerId: userId, comments: comment, ratings: [] });
  }

  /** Request revision — routes to the correct role-based endpoint */
  requestRevision(id: number, req: RevisionRequest, currentStep?: string) {
    const role    = this.getRole(currentStep);
    const userId  = this.userId;
    const comment = req.comment;

    if (role === 'MUNICIPAL_MANAGER') {
      return this.reviewSvc.submitMunicipalApproval(id, { municipalManagerId: userId, action: 'RETURNED_FOR_REVISION', comments: comment });
    }
    if (role === 'HR') {
      return this.reviewSvc.submitHrModeration(id, { hrModeratorId: userId, action: 'RETURNED_FOR_REVISION', comments: comment });
    }
    if (role === 'DIRECTOR') {
      return this.reviewSvc.submitDirectorAssessment(id, { directorId: userId, action: 'RETURNED_FOR_REVISION', comments: comment });
    }
    return this.reviewSvc.submitManagerAssessment(id, { managerId: userId, comments: comment, ratings: [] });
  }

  // ── Role-specific passthrough methods ────────────────────────────────────

  submitManagerAssessment(id: number, request: ManagerAssessmentRequest) {
    return this.reviewSvc.submitManagerAssessment(id, request);
  }

  submitDirectorAssessment(id: number, request: DirectorAssessmentRequest) {
    return this.reviewSvc.submitDirectorAssessment(id, request);
  }

  submitHrModeration(id: number, request: HrModerationRequest) {
    return this.reviewSvc.submitHrModeration(id, request);
  }

  submitMunicipalApproval(id: number, request: MunicipalManagerApprovalRequest) {
    return this.reviewSvc.submitMunicipalApproval(id, request);
  }

  lock(id: number, lockedById: number) {
    return this.reviewSvc.lock(id, { lockedById });
  }
}

