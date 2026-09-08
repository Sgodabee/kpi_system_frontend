import { PerformanceRating } from './performance-rating';

/** Body sent to POST /api/v1/reviews/{id}/approve */
export interface ApprovalRequest {
  rating?: PerformanceRating;
  comment?: string;
}

/** Body sent to POST /api/v1/reviews/{id}/reject */
export interface RejectionRequest {
  reason: string;
  comment?: string;
}

/** Body sent to POST /api/v1/reviews/{id}/request-revision */
export interface RevisionRequest {
  comment: string;
  specificRequirements?: string;
}

/** Response body returned by all three action endpoints */
export interface ApprovalResponse {
  reviewId: number;
  action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  nextStep?: string;
  processInstanceId?: string;
  timestamp: string;
  message?: string;
}

