export type ReportType =
  | 'EMPLOYEE_PERFORMANCE'
  | 'DEPARTMENT_PERFORMANCE'
  | 'KPI_COMPLETION'
  | 'MUNICIPALITY_SCORECARD'
  | 'QUARTERLY_REPORT'
  | 'ANNUAL_REPORT'
  | 'EXECUTIVE_SUMMARY'
  | 'OUTSTANDING_PERFORMERS'
  | 'UNDERPERFORMERS'
  | 'AUDIT_TRAIL';

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV';
export type ReportStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: string;
  /** Which optional param fields to show */
  params: ('departmentId' | 'employeeId' | 'period' | 'financialYear' | 'cycleId')[];
}

export const REPORT_TYPES: ReportTypeOption[] = [
  { value: 'EMPLOYEE_PERFORMANCE',  label: 'Employee Performance',     description: 'Individual KPI scores and achievement for a period',          icon: 'person',           params: ['employeeId', 'period', 'financialYear'] },
  { value: 'DEPARTMENT_PERFORMANCE',label: 'Department Performance',   description: 'Aggregate scores per department',                             icon: 'corporate_fare',   params: ['departmentId', 'period', 'financialYear'] },
  { value: 'KPI_COMPLETION',        label: 'KPI Summary',              description: 'Completion and achievement rates per KPI',                    icon: 'bar_chart',        params: ['period', 'financialYear'] },
  { value: 'MUNICIPALITY_SCORECARD',label: 'Municipality Scorecard',   description: 'Full consolidated performance scorecard for the municipality', icon: 'account_balance',  params: ['financialYear'] },
  { value: 'QUARTERLY_REPORT',      label: 'Quarterly Report',         description: 'All employees within a performance cycle or quarter',         icon: 'loop',             params: ['cycleId', 'financialYear'] },
  { value: 'ANNUAL_REPORT',         label: 'Annual Report',            description: 'Full-year consolidated performance report',                   icon: 'calendar_month',   params: ['financialYear'] },
  { value: 'EXECUTIVE_SUMMARY',     label: 'Executive Summary',        description: 'High-level summary for executive / council consumption',      icon: 'summarize',        params: ['financialYear'] },
  { value: 'OUTSTANDING_PERFORMERS',label: 'Top Performers',           description: 'Employees ranked by score — highest achievers',              icon: 'emoji_events',     params: ['departmentId', 'period', 'financialYear'] },
  { value: 'UNDERPERFORMERS',       label: 'Underperformers',          description: 'Employees below the performance threshold',                   icon: 'trending_down',    params: ['departmentId', 'period', 'financialYear'] },
  { value: 'AUDIT_TRAIL',           label: 'Audit Trail',              description: 'Review process timing, approvals and evidence compliance',    icon: 'workspaces',       params: ['period', 'financialYear'] },
];

export interface ReportParameters {
  departmentId?:   number;
  employeeId?:     number;
  period?:         string;  // YYYY-MM
  financialYear?:  string;  // 2025-2026
  cycleId?:        number;
  year?:           number;
  municipalityId?: number;
}

export interface ReportRequest {
  reportType: ReportType;
  format?:    ReportFormat;
  filter?:    ReportParameters;
}

export interface ReportExecution {
  id:                    string;
  reportType:            ReportType;
  reportName?:           string;
  reportDefinitionName?: string;
  format:                ReportFormat;
  status:                ReportStatus;
  requestedAt?:          string;
  createdAt?:            string;
  completedAt?:          string;
  generatedAt?:          string;
  downloadUrl?:          string;
  fileName?:             string;
  fileSizeBytes?:        number;
  errorMessage?:         string;
}

export interface ReportGenerateResponse {
  id?:          string;
  executionId?: string;
  status:       ReportStatus;
}

export interface ReportFilter {
  page?:   number;
  size?:   number;
  status?: ReportStatus;
}
