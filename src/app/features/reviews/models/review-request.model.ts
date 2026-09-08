/** Typed request/response models aligned with the API swagger spec */

export type ReviewStatus =
  | 'OPEN' | 'MANAGER_ASSESSED' | 'DIRECTOR_ASSESSED'
  | 'HR_MODERATED' | 'MUNICIPAL_MANAGER_APPROVED' | 'FINALISED' | 'LOCKED';

export interface RatingItem {
  performanceRecordId: number;
  managerRating:       number;
  managerComment?:     string;
}

export interface ReviewResponse {
  id:              number;
  employeeId:      number;
  employeeNumber:  string;
  employeeName:    string;
  departmentName?: string;
  divisionName?:   string;
  positionTitle?:  string;
  reviewYear:      number;
  reviewPeriod:    string;
  status:          ReviewStatus;
  overallScore?:   number;
  managerScore?:   number;
  directorScore?:  number;
  hrScore?:        number;
  createdById:     number;
  createdByEmail:  string;
  locked:          boolean;
  lockedAt?:       string;
  lockedById?:     number;
  lockedByEmail?:  string;
  createdAt:       string;
  updatedAt:       string;
}

export interface RatingResponse {
  id:                  number;
  reviewId:            number;
  performanceRecordId: number;
  assignmentId:        number;
  kpiDefinitionCode:   string;
  kpiDefinitionName:   string;
  baseScore?:          number;
  managerRating?:      number;
  managerComment?:     string;
  directorRating?:     number;
  directorComment?:    string;
  hrModeratedRating?:  number;
  hrComment?:          string;
  finalRating?:        number;
  createdAt:           string;
  updatedAt:           string;
}

export interface ApprovalResponse {
  id:              number;
  reviewId:        number;
  approvalLevel:   'MANAGER' | 'DIRECTOR' | 'HR_MODERATOR' | 'MUNICIPAL_MANAGER';
  action:          'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION';
  approvedById:    number;
  approvedByEmail: string;
  approvedByName:  string;
  comments?:       string;
  actedAt:         string;
  createdAt:       string;
}

export interface OutcomeResponse {
  id:                    number;
  reviewId:              number;
  employeeId:            number;
  employeeNumber:        string;
  employeeName:          string;
  finalScore?:           number;
  performanceRating?:    string;
  outcomeNotes?:         string;
  incrementRecommended:  boolean;
  incrementPercentage?:  number;
  promotionRecommended:  boolean;
  trainingRecommended:   boolean;
  pipRequired:           boolean;
  createdById:           number;
  createdByEmail:        string;
  createdAt:             string;
  updatedAt:             string;
}

export interface ReviewDetailResponse extends ReviewResponse {
  ratings:   RatingResponse[];
  approvals: ApprovalResponse[];
  outcome?:  OutcomeResponse;
}

// ── Request bodies ──────────────────────────────────────────────────────────

export interface CreateReviewRequest {
  employeeId:           number;
  reviewYear:           number;
  reviewPeriod:         string;
  createdById:          number;
  performanceRecordIds: number[];
}

export interface ManagerAssessmentRequest {
  managerId:  number;
  comments?:  string;
  ratings:    RatingItem[];
}

export interface DirectorAssessmentRequest {
  directorId: number;
  action?:    'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION';
  comments?:  string;
  ratings?:   RatingItem[];
}

export interface HrModerationRequest {
  hrModeratorId: number;
  action?:       'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION';
  comments?:     string;
  ratings?:      RatingItem[];
}

export interface MunicipalManagerApprovalRequest {
  municipalManagerId: number;
  action?:            'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION';
  comments?:          string;
}

export interface LockReviewRequest {
  lockedById: number;
}

export interface FinaliseReviewRequest {
  createdById:          number;
  outcomeNotes?:        string;
  incrementRecommended?: boolean;
  incrementPercentage?:  number;
  promotionRecommended?: boolean;
  trainingRecommended?:  boolean;
  pipRequired?:          boolean;
}

