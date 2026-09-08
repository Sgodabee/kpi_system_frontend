export type AssignmentStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AssigneeType     = 'EMPLOYEE' | 'POSITION' | 'DIVISION' | 'DEPARTMENT' | 'MUNICIPALITY';
export type AssignmentPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

/** Aligned with API KpiAssignmentResponse */
export interface KpiAssignment {
  id:                number;
  kpiDefinitionId?:  number;
  kpiDefinitionName?: string;
  kpiDefinitionCode?: string;
  // Backward-compat aliases
  kpiId?:            number;
  kpiName?:          string;
  kpiCode?:          string;
  unit?:             string;
  // Assignee
  assigneeType?:     AssigneeType;
  assigneeId?:       number;
  // Period
  periodType?:       AssignmentPeriodType;
  periodYear?:       number;
  periodNumber?:     number;
  // Target
  targetValue?:      number;
  weight?:           number;
  // Status
  status:            AssignmentStatus;
  // Assignment metadata
  assignedById?:     number;
  assignedByEmail?:  string;
  fromTemplateId?:   number;
  fromTemplateName?: string;
  notes?:            string;
  createdAt?:        string;
  updatedAt?:        string;
  // Backward-compat extras
  employeeId?:       number;
  employeeName?:     string;
  departmentId?:     number;
  departmentName?:   string;
  divisionName?:     string;
  categoryName?:     string;
  actualValue?:      number;
  achievementPct?:   number;
  score?:            number;
  financialYear?:    string;
  cycleName?:        string;
  assignedDate?:     string;
  dueDate?:          string;
  submittedDate?:    string;
  reviewedDate?:     string;
  reviewerName?:     string;
  reviewerComment?:  string;
  evidenceCount?:    number;
}

export interface AssignmentFilter {
  assigneeType?:  AssigneeType | string;
  assigneeId?:    number;
  employeeId?:    number;
  year?:          number;
  status?:        AssignmentStatus | string;
  // Legacy
  page?:          number;
  size?:          number;
  search?:        string;
  departmentId?:  number;
  kpiId?:         number;
  financialYear?: string;
  sort?:          string;
  direction?:     'asc' | 'desc';
}

export interface AssignmentRequest {
  kpiDefinitionId: number;
  assigneeType:    AssigneeType;
  assigneeId:      number;
  periodType?:     AssignmentPeriodType;
  periodYear:      number;
  periodNumber:    number;
  targetValue:     number;
  weight?:         number;
  status?:         AssignmentStatus;
  assignedById?:   number;
  fromTemplateId?: number;
  notes?:          string;
  // Backward compat
  kpiId?:          number;
  employeeId?:     number;
  departmentId?:   number;
  dueDate?:        string;
  financialYear?:  string;
}
