/** Aligned with API DepartmentResponse */
export interface Department {
  id:               number;
  name:             string;
  code?:            string;
  description?:     string;
  municipalityId?:  number;
  municipalityName?: string;
  enabled?:         boolean;
  createdAt?:       string;
  updatedAt?:       string;
  // Extra fields kept for backward compat (not in API response)
  directorId?:      number;
  directorName?:    string;
  employeeCount?:   number;
  divisionCount?:   number;
  activeKpiCount?:  number;
  performanceScore?: number;
  status?:          'ACTIVE' | 'INACTIVE';
}

export interface DepartmentRequest {
  name:            string;
  code:            string;
  municipalityId:  number;
  description?:    string;
  enabled?:        boolean;
}
