import { Component, input, computed } from '@angular/core';
import { WorkflowStep, ReviewStatus, WORKFLOW_STEPS } from '../../models/performance-review';

@Component({
  selector: 'review-workflow',
  standalone: true,
  template: `
    <div class="rw-container">
      <h3 class="rw-title">Review Workflow</h3>
      <div class="rw-steps">
        @for (step of steps(); track step.key; let last = $last) {
          <div class="rw-step" [class]="stepClass(step.key)">
            <div class="rw-indicator">
              @if (isCompleted(step.key)) {
                <span class="material-symbols-rounded rw-check">check_circle</span>
              } @else if (isActive(step.key)) {
                <span class="rw-dot rw-dot--active"></span>
              } @else {
                <span class="rw-dot rw-dot--pending"></span>
              }
              @if (!last) { <span class="rw-line"></span> }
            </div>
            <div class="rw-label" [class.rw-label--active]="isActive(step.key)">
              {{ step.label }}
              @if (isActive(step.key)) {
                <span class="rw-badge">Current</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .rw-container { padding: 0; }
    .rw-title { font-size: .75rem; font-weight: 600; text-transform: uppercase;
                letter-spacing: .05em; color: var(--text-muted, #6b7280); margin: 0 0 1rem; }
    .rw-steps { display: flex; flex-direction: column; gap: 0; }
    .rw-step  { display: flex; align-items: flex-start; gap: .75rem; }
    .rw-indicator { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .rw-check { font-size: 1.25rem; color: #22c55e; }
    .rw-dot { display: block; width: .875rem; height: .875rem; border-radius: 50%; margin-top: .15rem; }
    .rw-dot--active  { background: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.25); }
    .rw-dot--pending { background: #d1d5db; border: 2px solid #9ca3af; }
    .rw-line { width: 2px; flex: 1; min-height: 1.5rem; background: #e5e7eb; margin: .25rem 0; }
    .rw-step--completed .rw-line { background: #22c55e; }
    .rw-step--active    .rw-line { background: linear-gradient(#3b82f6, #e5e7eb); }
    .rw-label { padding-top: .05rem; padding-bottom: 1.25rem; font-size: .875rem; color: #374151;
                display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .rw-label--active { font-weight: 600; color: #1d4ed8; }
    .rw-step--completed .rw-label { color: #6b7280; }
    .rw-badge { font-size: .65rem; font-weight: 600; padding: .15rem .45rem; border-radius: 99px;
                background: #dbeafe; color: #1d4ed8; text-transform: uppercase; }
  `],
})
export class ReviewWorkflow {
  currentStep = input.required<WorkflowStep>();
  status      = input<ReviewStatus>('PENDING');

  readonly steps = computed(() => WORKFLOW_STEPS);

  private stepIndex(key: WorkflowStep): number {
    return WORKFLOW_STEPS.findIndex(s => s.key === key);
  }

  isCompleted(key: WorkflowStep): boolean {
    const cur = this.stepIndex(this.currentStep());
    const idx = this.stepIndex(key);
    if (key === 'EMPLOYEE_SUBMISSION') return cur >= 1;
    return idx < cur;
  }

  isActive(key: WorkflowStep): boolean {
    return key === this.currentStep();
  }

  isPending(key: WorkflowStep): boolean {
    return !this.isCompleted(key) && !this.isActive(key);
  }

  stepClass(key: WorkflowStep): string {
    if (this.isCompleted(key)) return 'rw-step--completed';
    if (this.isActive(key))    return 'rw-step--active';
    return 'rw-step--pending';
  }
}

