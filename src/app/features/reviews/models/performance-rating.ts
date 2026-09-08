export type PerformanceRating =
  | 'OUTSTANDING'
  | 'EXCEEDS_EXPECTATIONS'
  | 'MEETS_EXPECTATIONS'
  | 'NEEDS_IMPROVEMENT'
  | 'UNACCEPTABLE';

export interface RatingOption {
  value: PerformanceRating;
  label: string;
  description: string;
  colorClass: string;
  scoreRange: string;
}

export const RATING_OPTIONS: RatingOption[] = [
  {
    value: 'OUTSTANDING',
    label: 'Outstanding',
    description: 'Exceptional performance significantly exceeding all targets',
    colorClass: 'rating-outstanding',
    scoreRange: '95 – 100%',
  },
  {
    value: 'EXCEEDS_EXPECTATIONS',
    label: 'Exceeds Expectations',
    description: 'Performance consistently above the required standard',
    colorClass: 'rating-exceeds',
    scoreRange: '80 – 94%',
  },
  {
    value: 'MEETS_EXPECTATIONS',
    label: 'Meets Expectations',
    description: 'Performance fully meets all required standards',
    colorClass: 'rating-meets',
    scoreRange: '60 – 79%',
  },
  {
    value: 'NEEDS_IMPROVEMENT',
    label: 'Needs Improvement',
    description: 'Performance partially meets required standards',
    colorClass: 'rating-needs',
    scoreRange: '40 – 59%',
  },
  {
    value: 'UNACCEPTABLE',
    label: 'Unacceptable',
    description: 'Performance does not meet minimum requirements',
    colorClass: 'rating-unacceptable',
    scoreRange: '0 – 39%',
  },
];

/** Suggest a rating based on the numeric score */
export function suggestRating(score: number): PerformanceRating {
  if (score >= 95) return 'OUTSTANDING';
  if (score >= 80) return 'EXCEEDS_EXPECTATIONS';
  if (score >= 60) return 'MEETS_EXPECTATIONS';
  if (score >= 40) return 'NEEDS_IMPROVEMENT';
  return 'UNACCEPTABLE';
}

export function ratingLabel(r: PerformanceRating | undefined | null): string {
  return RATING_OPTIONS.find(o => o.value === r)?.label ?? '—';
}

