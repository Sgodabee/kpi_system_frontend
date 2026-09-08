/** Aligned with API EmployeeResponse */
export interface Employee {
  id:               number;
  employeeNumber?:  string;
  firstName:        string;
  lastName:         string;
  fullName?:        string;   // derived: firstName + lastName
  email:            string;
  phone?:           string;
  phoneNumber?:     string;   // alias for phone
  positionId?:      number;
  positionName?:    string;
  divisionId?:      number;
  divisionName?:    string;
  departmentId?:    number;
  departmentName?:  string;
  municipalityId?:  number;
  municipalityName?: string;
  userId?:          number;
  startDate?:       string;
  endDate?:         string;
  status:           'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  createdAt?:       string;
  updatedAt?:       string;
  // Backward-compat extras
  positionTitle?:   string;
  grade?:           string;
  managerId?:       number;
  managerName?:     string;
  hireDate?:        string;
  profileImageUrl?: string;
  performanceScore?: number;
  assignedKpiCount?: number;
  completedKpiCount?: number;
  pendingKpiCount?:  number;
}

export interface EmployeeFilter {
  page?:          number;
  size?:          number;
  positionId?:    number;
  departmentId?:  number;
  divisionId?:    number;
  municipalityId?: number;
  search?:        string;
  status?:        string;
  sort?:          string;
  direction?:     'asc' | 'desc';
}

export interface EmployeeRequest {
  employeeNumber:  string;
  firstName:       string;
  lastName:        string;
  email:           string;
  phone?:          string;
  positionId:      number;
  userId?:         number;
  startDate:       string;
  endDate?:        string;
  status?:         'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}
