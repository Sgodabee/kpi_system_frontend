import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewRating } from '../review-rating/review-rating';
import { PerformanceRating, suggestRating } from '../../models/performance-rating';
import { ApprovalRequest } from '../../models/performance-approval';

@Component({
  selector: 'review-assessment',
  standalone: true,
  imports: [FormsModule, ReviewRating],
  template: `
    <div class="ra-card">
      <h3 class="ra-title">
        <span class="material-symbols-rounded">rate_review</span>
        {{ sectionTitle() }}
      </h3>

      @if (suggestedRating()) {
        <div class="ra-suggestion">
          <span class="material-symbols-rounded">lightbulb</span>
          Suggested rating based on score: <strong>{{ suggestedLabel() }}</strong>
        </div>
      }

      <review-rating [(selected)]="rating" [disabled]="disabled()" />

      <div class="ra-field">
        <label class="ra-label" for="assessmentComment">Comments</label>
        <textarea id="assessmentComment" class="ra-textarea"
                  rows="4"
                  placeholder="Add your assessment comments…"
                  [(ngModel)]="comment"
                  [disabled]="disabled()"></textarea>
      </div>
    </div>
  `,
  styles: [`
    .ra-card    { background: #fff; border: 1px solid #e5e7eb; border-radius: .75rem; padding: 1.25rem; }
    .ra-title   { display: flex; align-items: center; gap: .5rem; font-size: 1rem; font-weight: 600;
                  color: #111827; margin: 0 0 1rem; }
    .ra-title .material-symbols-rounded { font-size: 1.2rem; color: #6b7280; }
    .ra-suggestion { display: flex; align-items: center; gap: .5rem; font-size: .8rem; padding: .5rem .75rem;
                     background: #fffbeb; border: 1px solid #fde68a; border-radius: .5rem; margin-bottom: 1rem; color: #92400e; }
    .ra-suggestion .material-symbols-rounded { font-size: 1rem; color: #d97706; }
    .ra-field   { margin-top: 1rem; }
    .ra-label   { display: block; font-size: .8rem; font-weight: 500; color: #374151; margin-bottom: .35rem; }
    .ra-textarea { width: 100%; box-sizing: border-box; padding: .5rem .75rem; border: 1px solid #d1d5db;
                   border-radius: .5rem; font-size: .875rem; resize: vertical; min-height: 90px;
                   font-family: inherit; transition: border-color .15s; }
    .ra-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
    .ra-textarea:disabled { background: #f9fafb; color: #6b7280; }
  `],
})
export class ReviewAssessment {
  /** Pre-select a suggested rating based on the employee's score */
  suggestedRating = input<PerformanceRating | null>(null);
  disabled        = input(false);
  roleLabel       = input<string>('Manager Assessment');

  rating  = signal<PerformanceRating | null>(null);
  comment = '';

  sectionTitle = computed(() => this.roleLabel());

  suggestedLabel = computed(() => {
    const r = this.suggestedRating();
    if (!r) return '';
    const map: Record<string, string> = {
      OUTSTANDING: 'Outstanding', EXCEEDS_EXPECTATIONS: 'Exceeds Expectations',
      MEETS_EXPECTATIONS: 'Meets Expectations', NEEDS_IMPROVEMENT: 'Needs Improvement',
      UNACCEPTABLE: 'Unacceptable',
    };
    return map[r] ?? r;
  });

  /** Called by parent to get the current form value */
  getValue(): ApprovalRequest {
    return { rating: this.rating() ?? undefined, comment: this.comment || undefined };
  }

  reset(): void {
    this.rating.set(this.suggestedRating());
    this.comment = '';
  }
}

