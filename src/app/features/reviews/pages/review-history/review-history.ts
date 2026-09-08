import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ReviewService } from '../../services/review.service';
import { WorkflowHistoryItem } from '../../models/performance-outcome';

@Component({
  selector: 'app-review-history',
  standalone: true,
  imports: [RouterLink, TitleCasePipe],
  templateUrl: './review-history.html',
  styleUrl: './review-history.css',
})
export class ReviewHistory implements OnInit {
  private route     = inject(ActivatedRoute);
  private reviewSvc = inject(ReviewService);

  reviewId  = 0;
  history   = signal<WorkflowHistoryItem[]>([]);
  isLoading = signal(true);
  error     = signal<string | null>(null);

  ngOnInit(): void {
    this.reviewId = Number(this.route.snapshot.params['id']);
    this.reviewSvc.getHistory(this.reviewId).subscribe({
      next:  h  => { this.history.set(h);  this.isLoading.set(false); },
      error: err => {
        this.error.set(`Failed to load history (HTTP ${err.status}).`);
        this.isLoading.set(false);
      },
    });
  }

  actionIcon(action: string): string {
    const map: Record<string, string> = {
      SUBMITTED: 'upload', APPROVED: 'check_circle',
      REJECTED: 'cancel', REVISION_REQUESTED: 'undo', LOCKED: 'lock',
    };
    return map[action] ?? 'history';
  }

  actionClass(action: string): string {
    const map: Record<string, string> = {
      SUBMITTED: 'act-submitted', APPROVED: 'act-approved',
      REJECTED: 'act-rejected', REVISION_REQUESTED: 'act-revision', LOCKED: 'act-locked',
    };
    return map[action] ?? '';
  }

  formatDate(iso: string): string {
    try { return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }
}



