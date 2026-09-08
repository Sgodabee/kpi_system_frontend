import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, TitleCasePipe, DatePipe } from '@angular/common';
import { PerformanceService }  from '../../services/performance.service';
import { EvidenceService }     from '../../services/evidence.service';
import { AuthService }         from '../../../../core/auth/auth.service';
import { PerformanceRecord, PerformanceStatus } from '../../models/performance-record.model';
import { PerformanceEvidence } from '../../models/performance-evidence.model';
import { PerformanceTimeline } from '../../components/performance-timeline/performance-timeline';
import { PerformanceComments } from '../../components/performance-comments/performance-comments';
import { EvidenceUploader }    from '../../components/evidence-uploader/evidence-uploader';

@Component({
  selector: 'app-performance-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, PerformanceTimeline, PerformanceComments, EvidenceUploader],
  templateUrl: './performance-detail.html',
  styleUrl: './performance-detail.css'
})
export class PerformanceDetail implements OnInit {
  private route       = inject(ActivatedRoute);
  private perfService = inject(PerformanceService);
  private evidService = inject(EvidenceService);
  private authService = inject(AuthService);
  private router      = inject(Router);
  private location    = inject(Location);

  record    = signal<PerformanceRecord | null>(null);
  evidence  = signal<PerformanceEvidence[]>([]);
  isLoading = signal(true);
  error     = signal<string | null>(null);
  actionBusy= signal(false);
  activeTab = signal<'details'|'comments'|'evidence'>('details');

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => this.load(Number(p.get('id'))));
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.perfService.getById(id).subscribe({
      next: r => {
        this.record.set(r);
        this.isLoading.set(false);
        this.loadEvidence(id);
      },
      error: err => {
        this.error.set(err.status === 404 ? 'Record not found.' : 'Failed to load.');
        this.isLoading.set(false);
      }
    });
  }

  private loadEvidence(id: number): void {
    this.evidService.getByRecord(id).subscribe({
      next: ev => this.evidence.set(ev)
    });
  }

  editRecord(): void { this.router.navigate(['/performance', this.record()!.id, 'edit']); }

  submit(): void {
    if (!this.record()) return;
    this.actionBusy.set(true);
    const userId = this.authService.currentUser()?.id ?? 0;
    this.perfService.submit(this.record()!.id, userId).subscribe({
      next: r => { this.record.set(r); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  approve(): void {
    if (!this.record()) return;
    this.actionBusy.set(true);
    const userId = this.authService.currentUser()?.id ?? 0;
    this.perfService.approve(this.record()!.id, userId).subscribe({
      next: r => { this.record.set(r); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  reject(): void {
    const comment = prompt('Reason for rejection (required):');
    if (!comment) return;
    this.actionBusy.set(true);
    const userId = this.authService.currentUser()?.id ?? 0;
    this.perfService.reject(this.record()!.id, userId, comment).subscribe({
      next: r => { this.record.set(r); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  goBack(): void { this.location.back(); }

  get canEdit():    boolean { return ['DRAFT', 'REJECTED'].includes(this.record()?.status ?? ''); }
  get canSubmit():  boolean { return this.record()?.status === 'DRAFT'; }
  get canReview():  boolean { return this.authService.hasAnyPermission(['KPI_REVIEW','KPI_APPROVE','ADMIN']); }
  get showApprove():boolean { return ['SUBMITTED', 'REVIEWED'].includes(this.record()?.status ?? '') && this.canReview; }
  get isRejected(): boolean { return this.record()?.status === 'REJECTED'; }

  statusBadge(s?: PerformanceStatus): string {
    if (!s) return 'badge-gray';
    const map: Record<string,string> = {
      DRAFT: 'badge-gray', SUBMITTED: 'badge-warning', REVIEWED: 'badge-info',
      APPROVED: 'badge-success', REJECTED: 'badge-danger'
    };
    return map[s] ?? 'badge-gray';
  }
  statusLabel(s?: PerformanceStatus): string {
    const map: Record<string,string> = {
      DRAFT: 'Draft', SUBMITTED: 'Submitted', REVIEWED: 'Under Review',
      APPROVED: 'Approved', REJECTED: 'Rejected'
    };
    return map[s ?? ''] ?? (s ?? '');
  }
  achievementColor(pct?: number | null): string {
    if (pct == null) return 'gray';
    if (pct >= 100) return 'green'; if (pct >= 75) return 'blue';
    if (pct >= 50) return 'orange'; return 'red';
  }

  onEvidenceUploaded(ev: PerformanceEvidence): void {
    this.evidence.update(list => [...list, ev]);
  }
  onEvidenceDeleted(id: number): void {
    this.evidence.update(list => list.filter(e => e.id !== id));
  }

  fileIcon(contentType?: string): string {
    if (!contentType) return 'attach_file';
    if (contentType.includes('pdf'))   return 'picture_as_pdf';
    if (contentType.includes('sheet')) return 'table_chart';
    if (contentType.includes('word'))  return 'description';
    if (contentType.includes('image')) return 'image';
    return 'attach_file';
  }
  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}


