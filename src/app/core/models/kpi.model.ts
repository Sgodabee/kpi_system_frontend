export type KpiType      = 'QUANTITATIVE' | 'QUALITATIVE';
export type KpiFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
export type KpiStatus    = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface KpiCategory {
  id:           number;
  name:         string;
  code?:        string;
  description?: string;
  kpiCount?:    number;
  status?:      'ACTIVE' | 'INACTIVE';
}

export interface Kpi {
  id:              number;
  name:            string;
  code?:           string;
  description?:    string;
  categoryId?:     number;
  categoryName?:   string;
  type:            KpiType;
  unit?:           string;           // %, ZAR, count, etc.
  frequency?:      KpiFrequency;
  targetValue?:    number;
  weight?:         number;           // percentage weight in scoring
  status:          KpiStatus;
  assignmentCount?: number;
  createdAt?:      string;
  updatedAt?:      string;
}

export interface KpiFilter {
  page?:       number;
  size?:       number;
  search?:     string;
  categoryId?: number;
  type?:       string;
  status?:     string;
  sort?:       string;
  direction?:  'asc' | 'desc';
}

export interface KpiRequest {
  name:        string;
  code?:       string;
  description?: string;
  categoryId?: number;
  type:        KpiType;
  unit?:       string;
  frequency?:  KpiFrequency;
  targetValue?: number;
  weight?:     number;
  status?:     KpiStatus;
}

