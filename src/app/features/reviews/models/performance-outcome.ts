import { PerformanceRating } from './performance-rating';

/** Immutable final result once the review process is completed and locked */
export interface PerformanceOutcome {
  id: number;
  reviewId: number;
  employeeId?: number;
  employeeName: string;
  departmentName: string;
  positionTitle?: string;
  financialYear?: string;
  cycleName?: string;
  finalScore?: number;
  finalRating?: PerformanceRating;
  finalComment?: string;
  lockedAt?: string;
  lockedByName?: string;
  workflowHistory?: WorkflowHistoryItem[];
}

/** One entry in the workflow audit trail */
export interface WorkflowHistoryItem {
  step: string;
  stepLabel: string;
  actorName: string;
  actorRole?: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'LOCKED';
  rating?: PerformanceRating;
  comment?: string;
  timestamp: string;
}

