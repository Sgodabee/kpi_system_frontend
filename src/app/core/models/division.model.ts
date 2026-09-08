/** Aligned with API DivisionResponse */
export interface Division {
  id:              number;
  name:            string;
  code?:           string;
  description?:    string;
  departmentId:    number;
  departmentName?: string;
  municipalityId?: number;
  municipalityName?: string;
  enabled?:        boolean;
  createdAt?:      string;
  updatedAt?:      string;
  // Backward compat
  managerId?:      number;
  managerName?:    string;
  employeeCount?:  number;
  activeKpiCount?: number;
  performanceScore?: number;
  status?:         'ACTIVE' | 'INACTIVE';
}

export interface DivisionRequest {
  name:         string;
  code:         string;
  departmentId: number;
  description?: string;
  enabled?:     boolean;
}
