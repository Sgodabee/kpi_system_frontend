import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { EvidenceService } from '../../services/evidence.service';
import { PerformanceEvidence, PendingUpload } from '../../models/performance-evidence.model';

@Component({
  selector: 'evidence-uploader',
  standalone: true,
  imports: [],
  templateUrl: './evidence-uploader.html',
  styleUrl: './evidence-uploader.css'
})
export class EvidenceUploader implements OnChanges {
  private evidenceService = inject(EvidenceService);

  @Input() recordId!: number;
  @Input() existingEvidence: PerformanceEvidence[] = [];
  @Input() readonly = false;
  @Output() evidenceUploaded = new EventEmitter<PerformanceEvidence>();
  @Output() evidenceDeleted  = new EventEmitter<number>();

  pendingFiles: PendingUpload[]  = [];
  isDragging   = false;
  errorMessage = signal<string | null>(null);

  private readonly ALLOWED = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
  ];
  private readonly MAX_MB = 10;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordId']) this.pendingFiles = [];
  }

  onDragOver(e: DragEvent): void  { e.preventDefault(); this.isDragging = true; }
  onDragLeave(): void             { this.isDragging = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragging = false;
    const files = e.dataTransfer?.files;
    if (files) this.addFiles(Array.from(files));
  }

  onBrowse(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (files) this.addFiles(Array.from(files));
    (e.target as HTMLInputElement).value = '';
  }

  addFiles(files: File[]): void {
    this.errorMessage.set(null);
    for (const f of files) {
      if (!this.ALLOWED.includes(f.type)) {
        this.errorMessage.set(`${f.name}: File type not supported (PDF, Excel, Word, images only).`);
        continue;
      }
      if (f.size > this.MAX_MB * 1024 * 1024) {
        this.errorMessage.set(`${f.name}: File exceeds ${this.MAX_MB} MB limit.`);
        continue;
      }
      const pending: PendingUpload = { file: f, progress: 0, status: 'pending' };
      this.pendingFiles.push(pending);
      this.uploadFile(pending);
    }
  }

  private uploadFile(pending: PendingUpload): void {
    pending.status = 'uploading';
    this.evidenceService.upload(this.recordId, pending.file, undefined, undefined, pct => pending.progress = pct).subscribe({
      next: ev => {
        pending.status = 'done';
        pending.progress = 100;
        this.evidenceUploaded.emit(ev);
        setTimeout(() => {
          this.pendingFiles = this.pendingFiles.filter(p => p !== pending);
        }, 3000);
      },
      error: () => {
        pending.status = 'error';
        pending.error  = 'Upload failed. Please try again.';
      }
    });
  }

  retryUpload(pending: PendingUpload): void {
    pending.status = 'pending';
    pending.error  = undefined;
    pending.progress = 0;
    this.uploadFile(pending);
  }

  removePending(pending: PendingUpload): void {
    this.pendingFiles = this.pendingFiles.filter(p => p !== pending);
  }

  deleteExisting(ev: PerformanceEvidence): void {
    this.evidenceService.delete(ev.id).subscribe(() => {
      this.evidenceDeleted.emit(ev.id);
    });
  }

  downloadFile(ev: PerformanceEvidence): void {
    this.evidenceService.download(ev.id, ev.fileName);
  }

  fileIcon(contentType?: string): string {
    if (!contentType) return 'attach_file';
    if (contentType.includes('pdf'))         return 'picture_as_pdf';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'table_chart';
    if (contentType.includes('word') || contentType.includes('document')) return 'description';
    if (contentType.includes('image'))       return 'image';
    return 'attach_file';
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

