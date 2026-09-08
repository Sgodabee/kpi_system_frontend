export type AdminSection =
  | 'financial-years'
  | 'performance-cycles'
  | 'rating-scales'
  | 'system-config'
  | 'notification-templates'
  | 'working-calendar';

/** Aligned with API FinancialYearResponse */
export interface FinancialYear {
  id?:        number;
  name:       string;
  startYear?: number;
  endYear?:   number;
  startDate:  string;
  endDate:    string;
  active?:    boolean;
  locked?:    boolean;
  createdAt?: string;
  updatedAt?: string;
  // Backward compat
  status?:    'ACTIVE' | 'CLOSED' | 'FUTURE';
  cycleCount?: number;
}

/** Aligned with API PerformanceCycleResponse */
export interface PerformanceCycle {
  id?:                number;
  name:               string;
  type?:              'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  status?:            'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  financialYearId:    number;
  financialYearName?: string;
  startDate:          string;
  endDate:            string;
  submissionDeadline?: string;
  reviewDeadline?:    string;
  current?:           boolean;
  description?:       string;
  createdAt?:         string;
  updatedAt?:         string;
  // Backward compat
  participantCount?:  number;
}

/** Aligned with API RatingScaleResponse */
export interface RatingScale {
  id?:          number;
  name:         string;
  description?: string;
  active?:      boolean;
  isDefault?:   boolean;
  default?:     boolean;
  levels?:      RatingScaleLevel[];
  createdAt?:   string;
  updatedAt?:   string;
  // Backward compat
  outstanding?:         number;
  exceedsExpectations?: number;
  meetsExpectations?:   number;
  needsImprovement?:    number;
}

export interface RatingScaleLevel {
  id?:          number;
  levelNumber:  number;
  label:        string;
  minScore:     number;
  maxScore:     number;
  color?:       string;
  description?: string;
}

/** Aligned with API SystemConfigResponse */
export interface SystemConfig {
  id?:          number;
  configKey?:   string;
  configValue?: string;
  dataType?:    'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSON';
  description?: string;
  category?:    string;
  editable?:    boolean;
  createdAt?:   string;
  updatedAt?:   string;
  // Backward compat
  maxEvidenceFileSizeMb?:  number;
  allowedEvidenceTypes?:   string[];
  reviewReminderDays?:     number;
  escalationAfterDays?:    number;
  sessionTimeoutMinutes?:  number;
  logoUrl?:                string;
  municipalityName?:       string;
}

/** Aligned with API NotificationTemplateResponse */
export interface NotificationTemplate {
  id?:           number;
  event?:        string;
  type?:         'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  name:          string;
  subject?:      string;
  bodyTemplate?: string;
  active?:       boolean;
  isDefault?:    boolean;
  default?:      boolean;
  createdAt?:    string;
  updatedAt?:    string;
  // Backward compat
  code?:         string;
  bodyHtml?:     string;
  trigger?:      string;
  isActive?:     boolean;
  lastModified?: string;
}

/** Aligned with API PublicHolidayResponse */
export interface PublicHoliday {
  id?:               number;
  workingCalendarId?: number;
  name:              string;
  holidayDate:       string;
  type:              'PUBLIC_HOLIDAY' | 'MUNICIPAL_HOLIDAY' | 'SPECIAL_DAY';
  recurring?:        boolean;
  description?:      string;
  createdAt?:        string;
  updatedAt?:        string;
  // Backward compat
  date?:             string;
}
