import { Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'review-score',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="rs-wrap" [class]="sizeClass()">
      <svg class="rs-ring" viewBox="0 0 36 36">
        <circle class="rs-track" cx="18" cy="18" r="15.9155" />
        <circle class="rs-fill" [class]="colorClass()" cx="18" cy="18" r="15.9155"
                stroke-dasharray="100 100"
                [attr.stroke-dashoffset]="dashOffset()" />
      </svg>
      <div class="rs-label">
        @if (score() != null) {
          <span class="rs-value" [class]="colorClass()">{{ score() | number:'1.0-1' }}<span class="rs-pct">%</span></span>
        } @else {
          <span class="rs-value rs-none">—</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .rs-wrap  { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    .rs-wrap.sm { width: 72px;  height: 72px; }
    .rs-wrap.md { width: 100px; height: 100px; }
    .rs-wrap.lg { width: 140px; height: 140px; }
    .rs-ring  { width: 100%; height: 100%; transform: rotate(-90deg); }
    .rs-track { fill: none; stroke: #e5e7eb; stroke-width: 3.5; }
    .rs-fill  { fill: none; stroke-width: 3.5; stroke-linecap: round; transition: stroke-dashoffset .6s ease; }
    .rs-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .rs-value { font-weight: 700; line-height: 1; }
    .rs-pct   { font-size: .55em; font-weight: 400; }
    .rs-none  { color: #9ca3af; }
    .sm .rs-value { font-size: .95rem; }
    .md .rs-value { font-size: 1.25rem; }
    .lg .rs-value { font-size: 1.75rem; }
    /* score colour classes */
    .score-green  { stroke: #22c55e; color: #15803d; }
    .score-blue   { stroke: #3b82f6; color: #1d4ed8; }
    .score-orange { stroke: #f97316; color: #c2410c; }
    .score-red    { stroke: #ef4444; color: #b91c1c; }
    .score-gray   { stroke: #9ca3af; color: #6b7280; }
  `],
})
export class ReviewScore {
  score = input<number | null | undefined>(null);
  size  = input<'sm' | 'md' | 'lg'>('md');

  sizeClass = computed(() => this.size());

  colorClass = computed(() => {
    const s = this.score();
    if (s == null) return 'score-gray';
    if (s >= 90) return 'score-green';
    if (s >= 75) return 'score-blue';
    if (s >= 50) return 'score-orange';
    return 'score-red';
  });

  /** SVG stroke-dashoffset: 100 = empty, 0 = full */
  dashOffset = computed(() => {
    const s = this.score();
    if (s == null) return 100;
    return 100 - Math.max(0, Math.min(100, s));
  });
}

