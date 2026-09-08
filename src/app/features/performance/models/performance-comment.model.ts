export interface PerformanceComment {
  id:                   number;
  performanceRecordId?: number;
  authorId?:            number;
  authorName?:          string;
  authorRole?:          string;
  content:              string;
  createdAt?:           string;
  isSystemMessage?:     boolean;
}

