import { PerformanceRating } from './performance-rating';

// ── Workflow steps — mirrors the Camunda BPMN process ──────────────────────
export type WorkflowStep =
  | 'EMPLOYEE_SUBMISSION'
  | 'MANAGER_REVIEW'
  | 'DIRECTOR_REVIEW'
  | 'HR_MODERATION'
  | 'MUNICIPAL_MANAGER'
  | 'FINALISED'
  | 'LOCKED';

export type ReviewStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'OVERDUE';

export interface ReviewKpiItem {
  kpiId?: number;
  kpiName: string;
  kpiCode?: string;
  categoryName?: string;
  unit?: string;
  weight?: number;
  targetValue?: number;
  actualValue?: number;
  achievementPct?: number;
  score?: number;
}

export interface ReviewEvidence {
  id: number;
  fileName: string;
  originalFileName?: string;
  contentType?: string;
  fileSizeBytes?: number;
  uploadedByName?: string;
  uploadedAt?: string;
  downloadUrl?: string;
}

export interface ReviewComment {
  id: number;
  authorId?: number;
  authorName: string;
  authorRole?: string;
  content: string;
  createdAt?: string;
  isSystemMessage?: boolean;
}

/** Main review DTO returned by GET /api/v1/reviews and GET /api/v1/reviews/{id} */
export interface PerformanceReview {
  id: number;
  performanceRecordId?: number;
  processInstanceId?: string;
  // Employee info
  employeeId?: number;
  employeeName: string;
  employeeNumber?: string;
  positionTitle?: string;
  departmentName: string;
  divisionName?: string;
  // Scores
  overallScore?: number;
  // Workflow state
  status: ReviewStatus;
  currentStep: WorkflowStep;
  // Dates
  submittedAt?: string;
  dueDate?: string;
  reviewedAt?: string;
  // Reviewer details (current/last reviewer)
  reviewerName?: string;
  reviewerComment?: string;
  // Rating assigned by this reviewer
  rating?: PerformanceRating;
  // KPI breakdown
  kpiItems?: ReviewKpiItem[];
  // Evidence files
  evidence?: ReviewEvidence[];
  // Comment thread
  comments?: ReviewComment[];
  // Comments from employee
  employeeComment?: string;
}

// ── Filter for the review inbox ────────────────────────────────────────────
export interface ReviewFilter {
  page?: number;
  size?: number;
  status?: ReviewStatus | string;
  step?: WorkflowStep | string;
  departmentId?: number;
  employeeId?: number;
  year?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

// ── Stats counts for the inbox header cards ────────────────────────────────
export interface ReviewInboxStats {
  pending: number;
  overdue: number;
  completed: number;
  rejected: number;
}

// ── Workflow step metadata (label + icon) ──────────────────────────────────
export interface WorkflowStepMeta {
  key: WorkflowStep;
  label: string;
  icon: string;
}

export const WORKFLOW_STEPS: WorkflowStepMeta[] = [
  { key: 'EMPLOYEE_SUBMISSION', label: 'Employee Submission', icon: 'person'          },
  { key: 'MANAGER_REVIEW',      label: 'Manager Review',      icon: 'supervisor_account' },
  { key: 'DIRECTOR_REVIEW',     label: 'Director Review',     icon: 'manage_accounts'  },
  { key: 'HR_MODERATION',       label: 'HR Moderation',       icon: 'groups'           },
  { key: 'MUNICIPAL_MANAGER',   label: 'Municipal Manager',   icon: 'account_balance'  },
  { key: 'FINALISED',           label: 'Finalised',           icon: 'verified'         },
];

