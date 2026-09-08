/** Status values as returned by the API */
export type PerformanceStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

/** Matches API KpiDefinitionResponse.dataType enum (BOOLEAN added for legacy support) */
export type KpiDataType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'TEXT' | 'DATE' | 'BOOLEAN';

/** Matches API KpiDefinitionResponse.measurementDirection enum */
export type KpiDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'TARGET';

export type AssigneeType = 'EMPLOYEE' | 'POSITION' | 'DIVISION' | 'DEPARTMENT' | 'MUNICIPALITY';
export type PeriodType   = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

/** Aligned with API PerformanceResponse schema */
export interface PerformanceRecord {
  id:              number;
  assignmentId?:   number;
  reviewId?:       number;
  // KPI info (API field names)
  kpiDefinitionName?: string;
  kpiDefinitionCode?: string;
  // Backward-compat aliases
  kpiName?:        string;
  kpiCode?:        string;
  unit?:           string;
  // Assignee
  assigneeType?:   AssigneeType;
  assigneeId?:     number;
  employeeId?:     number;   // alias: assigneeId when EMPLOYEE
  employeeName?:   string;
  departmentName?: string;
  // Period
  periodType?:     PeriodType;
  periodYear?:     number;
  periodNumber?:   number;
  period?:         string;   // legacy field / derived
  // Values
  targetValue?:    number;
  actualValue?:    number | null;
  actualText?:     string | null;   // for TEXT-type KPIs
  actualBoolean?:  boolean | null;  // for BOOLEAN-type KPIs
  score?:          number | null;
  achievementPct?: number | null;  // alias for score
  notes?:          string;
  comment?:        string;   // alias for notes
  // Status
  status:          PerformanceStatus;
  // Submission
  submittedById?:  number;
  submittedByEmail?: string;
  submittedAt?:    string;
  // Review
  reviewedById?:   number;
  reviewedByEmail?: string;
  reviewedAt?:     string;
  reviewNotes?:    string;
  reviewerName?:   string;   // backward compat
  reviewerComment?: string;  // alias for reviewNotes
  // Timestamps
  createdAt?:      string;
  updatedAt?:      string;
  // Extra fields kept for backward compat
  kpiDataType?:    string;
  kpiUnit?:        string;
  kpiDirection?:   string;
  categoryName?:   string;
  frequency?:      string;
  weight?:         number;
  financialYear?:  string;
  cycleName?:      string;
  evidenceCount?:  number;
  commentCount?:   number;
}

export interface PerformanceFilter {
  page?:         number;
  size?:         number;
  assigneeType?: AssigneeType | string;
  assigneeId?:   number;
  employeeId?:   number;    // maps to assigneeId
  year?:         number;
  status?:       string;
  // Legacy / extra
  mine?:         boolean;
  departmentId?: number;
  kpiId?:        number;
  period?:       string;
  financialYear?: string;
  sort?:         string;
  direction?:    'asc' | 'desc';
}

export interface PerformanceRequest {
  assignmentId:  number | undefined;
  actualValue:   number;
  notes?:        string;
}
