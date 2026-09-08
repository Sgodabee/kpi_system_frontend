import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ReviewService } from '../../services/review.service';
import { PerformanceReview } from '../../models/performance-review';
import { ReviewWorkflow } from '../../components/review-workflow/review-workflow';
import { ReviewScore }    from '../../components/review-score/review-score';
import { EvidencePanel }  from '../../components/evidence-panel/evidence-panel';
import { ReviewComments } from '../../components/review-comments/review-comments';
import { ratingLabel }   from '../../models/performance-rating';

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReviewWorkflow, ReviewScore, EvidencePanel, ReviewComments],
  templateUrl: './review-detail.html',
  styleUrl: './review-detail.css',
})
export class ReviewDetail implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private reviewSvc = inject(ReviewService);

  review    = signal<PerformanceReview | null>(null);
  isLoading = signal(true);
  error     = signal<string | null>(null);

  readonly ratingLabel = ratingLabel;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.reviewSvc.getById(id).subscribe({
      next:  r  => { this.review.set(r);  this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 404 ? 'Review not found.' : `Error (HTTP ${err.status}).`);
        this.isLoading.set(false);
      },
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }

  achievementColor(pct?: number | null): string {
    if (pct == null) return 'gray';
    if (pct >= 100) return 'green'; if (pct >= 75) return 'blue';
    if (pct >= 50)  return 'orange'; return 'red';
  }

  viewHistory(): void {
    this.router.navigate(['/reviews', this.review()!.id, 'history']);
  }
}

