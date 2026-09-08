import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RATING_OPTIONS, PerformanceRating } from '../../models/performance-rating';

@Component({
  selector: 'review-rating',
  standalone: true,
  imports: [FormsModule],
  template: `
    <fieldset class="rr-fieldset" [disabled]="disabled()">
      <legend class="rr-legend">Rating</legend>
      @for (opt of options; track opt.value) {
        <label class="rr-option" [class.rr-option--selected]="selected() === opt.value"
               [class]="selected() === opt.value ? opt.colorClass : ''">
          <input type="radio" class="rr-radio" name="rating"
                 [value]="opt.value"
                 [checked]="selected() === opt.value"
                 (change)="onChange(opt.value)" />
          <span class="rr-dot" [class]="opt.colorClass"></span>
          <span class="rr-text">
            <span class="rr-label">{{ opt.label }}</span>
            <span class="rr-range">{{ opt.scoreRange }}</span>
          </span>
        </label>
      }
    </fieldset>
  `,
  styles: [`
    .rr-fieldset { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; }
    .rr-legend   { font-size: .75rem; font-weight: 600; text-transform: uppercase;
                   letter-spacing: .05em; color: var(--text-muted,#6b7280); margin-bottom: .5rem; float: none; width: 100%; }
    .rr-option   { display: flex; align-items: center; gap: .75rem; padding: .6rem .875rem;
                   border: 1.5px solid #e5e7eb; border-radius: .5rem; cursor: pointer;
                   transition: border-color .15s, background .15s; }
    .rr-option:hover { border-color: #6b7280; }
    .rr-radio    { position: absolute; opacity: 0; width: 0; height: 0; }
    .rr-dot      { width: .875rem; height: .875rem; border-radius: 50%; flex-shrink: 0; }
    .rr-text     { display: flex; flex-direction: column; gap: .1rem; }
    .rr-label    { font-size: .875rem; font-weight: 500; color: #111827; }
    .rr-range    { font-size: .75rem; color: #6b7280; }
    /* selected state */
    .rr-option--selected { border-color: currentColor; background: #f8fafc; }
    /* colour overrides (from model) */
    .rating-outstanding  { color: #15803d; } .rating-outstanding  .rr-dot { background: #22c55e; }
    .rating-exceeds      { color: #1d4ed8; } .rating-exceeds      .rr-dot { background: #3b82f6; }
    .rating-meets        { color: #0f766e; } .rating-meets        .rr-dot { background: #14b8a6; }
    .rating-needs        { color: #c2410c; } .rating-needs        .rr-dot { background: #f97316; }
    .rating-unacceptable { color: #b91c1c; } .rating-unacceptable .rr-dot { background: #ef4444; }
    fieldset[disabled] .rr-option { opacity: .6; cursor: default; pointer-events: none; }
  `],
})
export class ReviewRating {
  selected = model<PerformanceRating | null>(null);
  disabled = input(false);

  readonly options = RATING_OPTIONS;

  onChange(value: PerformanceRating): void {
    this.selected.set(value);
  }
}

