export interface PerformanceEvidence {
  id:                   number;
  performanceRecordId?: number;
  fileName:             string;
  originalFileName?:    string;
  contentType?:         string;
  fileSizeBytes?:       number;
  uploadedByName?:      string;
  uploadedAt?:          string;
  downloadUrl?:         string;
}

export interface PendingUpload {
  file:     File;
  progress: number;            // 0–100
  status:   'pending' | 'uploading' | 'done' | 'error';
  error?:   string;
}

