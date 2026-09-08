// ── Shared sub-types ──────────────────────────────────────────────────────────

export interface PendingActionDto {
  actionType:  string;
  entityType:  string;
  entityId:    number;
  description: string;
  dueDate?:    string;
  overdue:     boolean;
  priority:    string;
}

export interface PerformanceTrendDto {
  period:           string;
  reviewYear:       number;
  averageScore:     number;
  totalEmployees:   number;
  completedReviews: number;
  completionRate:   number;
}

export interface TopPerformerDto {
  employeeId:           number;
  fullName:             string;
  departmentName:       string;
  positionTitle:        string;
  score:                number;
  performanceBand:      string;
  incrementRecommended: boolean;
}

export interface DepartmentSummaryDto {
  departmentId:    number;
  departmentName:  string;
  departmentCode:  string;
  municipalityName: string;
  employeeCount:   number;
  reviewedCount:   number;
  averageScore:    number;
  performanceBand: string;
  riskLevel:       number;
}

export interface RiskHeatMapDto {
  departmentId:    number;
  departmentName:  string;
  municipalityName: string;
  score:           number;
  riskLevel:       string;   // 'low' | 'medium' | 'high'
  reason:          string;
  overdueCount:    number;
}

export interface AlertDto {
  alertType:   string;
  message:     string;
  module:      string;
  count:       number;
  detectedAt:  string;
}

// ── Dashboard responses ────────────────────────────────────────────────────────

export interface EmployeeDashboardResponse {
  employeeId:           number;
  employeeName:         string;
  positionTitle:        string;
  departmentName:       string;
  currentCycleName:     string;
  submissionDeadline:   string;  // date
  daysToDeadline:       number;
  myKpiCount:           number;
  submittedKpis:        number;
  approvedKpis:         number;
  pendingKpis:          number;
  completionRate:       number;
  currentScore:         number;
  previousScore:        number;
  scoreTrend:           number;
  performanceBand:      string;
  performanceRating:    string;
  reviewStatus:         string;
  incrementRecommended: boolean;
  promotionRecommended: boolean;
  pipRequired:          boolean;
  myTrend:              PerformanceTrendDto[];
  unreadNotifications:  number;
  pendingActions:       PendingActionDto[];
  generatedAt:          string;
}

export interface ManagerDashboardResponse {
  managerId:              number;
  managerName:            string;
  departmentName:         string;
  teamSize:               number;
  submittedCount:         number;
  pendingSubmissionCount: number;
  approvedCount:          number;
  rejectedCount:          number;
  teamAverageScore:       number;
  pendingReviews:         PendingActionDto[];
  overdueReviewCount:     number;
  totalKpis:              number;
  completedKpis:          number;
  overdueKpis:            number;
  completionRate:         number;
  topTeamPerformers:      TopPerformerDto[];
  bottomTeamPerformers:   TopPerformerDto[];
  teamTrend:              PerformanceTrendDto[];
  generatedAt:            string;
}

export interface ExecutiveDashboardResponse {
  overallPerformance:   number;
  totalMunicipalities:  number;
  totalDepartments:     number;
  totalEmployees:       number;
  activeEmployees:      number;
  employeesReviewed:    number;
  pendingApprovals:     number;
  lateSubmissions:      number;
  criticalKpis:         number;
  currentCycleName:     string;
  submissionDeadline:   string;
  daysToDeadline:       number;
  cycleCompletionRate:  number;
  topDepartments:       DepartmentSummaryDto[];
  bottomDepartments:    DepartmentSummaryDto[];
  performanceTrend:     PerformanceTrendDto[];
  riskHeatMap:          RiskHeatMapDto[];
  topPerformers:        TopPerformerDto[];
  alerts:               AlertDto[];
  outstandingCount:     number;
  exceedsCount:         number;
  meetsCount:           number;
  needsImprovementCount: number;
  unacceptableCount:    number;
  generatedAt:          string;
}

