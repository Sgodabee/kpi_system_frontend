import { Component, Input } from '@angular/core';
import { PerformanceStatus } from '../../models/performance-record.model';

interface TimelineStep {
  label:  string;
  icon:   string;
  done:   boolean;
  active: boolean;
  failed: boolean;
}

@Component({
  selector: 'performance-timeline',
  standalone: true,
  imports: [],
  template: `
<div class="ptl-root">
  <div class="ptl-steps">
    @for (step of steps; track step.label; let last = $last) {
      <div class="ptl-step" [class.done]="step.done" [class.active]="step.active" [class.failed]="step.failed">
        <div class="ptl-icon-wrap">
          <span class="material-symbols-rounded ptl-icon">{{ step.icon }}</span>
        </div>
        <span class="ptl-label">{{ step.label }}</span>
      </div>
      @if (!last) {
        <div class="ptl-connector" [class.done]="step.done" [class.failed]="step.failed"></div>
      }
    }
  </div>

  <!-- Rejection / revision reason -->
  @if (isRejected && rejectionComment) {
    <div class="ptl-rejection">
      <div class="ptl-rejection-header">
        <span class="material-symbols-rounded" style="color:var(--danger);font-size:20px">warning</span>
        <strong>Rejected</strong>
        @if (reviewerName) { <span class="ptl-reviewer">by {{ reviewerName }}</span> }
      </div>
      <p class="ptl-rejection-comment">"{{ rejectionComment }}"</p>
    </div>
  }
</div>
  `,
  styles: [`
.ptl-root { display: flex; flex-direction: column; gap: 16px; }
.ptl-steps {
  display: flex; align-items: center; flex-wrap: nowrap;
  overflow-x: auto; padding-bottom: 4px; gap: 0;
}
.ptl-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.ptl-icon-wrap {
  width: 44px; height: 44px; border-radius: 50%;
  border: 2.5px solid var(--border-color); background: white;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.ptl-icon { font-size: 20px; color: var(--text-muted); transition: color .2s; }
.ptl-label { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-align: center; white-space: nowrap; }
.ptl-step.done .ptl-icon-wrap { border-color: var(--success); background: var(--success-bg); }
.ptl-step.done .ptl-icon   { color: var(--success); }
.ptl-step.done .ptl-label  { color: var(--success); }
.ptl-step.active .ptl-icon-wrap { border-color: var(--primary); background: var(--primary-50); box-shadow: 0 0 0 3px var(--primary-ring); }
.ptl-step.active .ptl-icon  { color: var(--primary); }
.ptl-step.active .ptl-label { color: var(--primary); font-weight: 700; }
.ptl-step.failed .ptl-icon-wrap { border-color: var(--danger); background: var(--danger-bg); }
.ptl-step.failed .ptl-icon  { color: var(--danger); }
.ptl-step.failed .ptl-label { color: var(--danger); }
.ptl-connector { flex: 1; min-width: 24px; height: 2px; background: var(--border-color); margin: 0 4px; margin-bottom: 20px; transition: background .2s; }
.ptl-connector.done   { background: var(--success); }
.ptl-connector.failed { background: var(--danger); }
.ptl-rejection {
  background: #fff8f1; border: 1px solid #fcd34d;
  border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
}
.ptl-rejection-header { display: flex; align-items: center; gap: 8px; }
.ptl-reviewer { font-size: 0.8125rem; color: var(--text-secondary); margin-left: auto; }
.ptl-rejection-comment { font-size: 0.9rem; color: var(--gray-700); font-style: italic; margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 3px solid var(--danger); }
  `]
})
export class PerformanceTimeline {
  @Input() status!: PerformanceStatus;
  @Input() rejectionComment?: string;
  @Input() reviewerName?: string;

  get isRejected(): boolean {
    return this.status === 'REJECTED';
  }

  get steps(): TimelineStep[] {
    const ORDER: PerformanceStatus[] = ['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED'];
    const s      = this.status;
    const curIdx = ORDER.indexOf(s as PerformanceStatus);
    const rejected = this.isRejected;

    return [
      { label: 'Draft',       icon: 'edit',        done: curIdx > 0,           active: curIdx === 0 && !rejected, failed: false    },
      { label: 'Submitted',   icon: 'upload_file', done: curIdx > 1,           active: curIdx === 1 && !rejected, failed: false    },
      { label: 'Under Review',icon: 'rate_review', done: curIdx > 2,           active: curIdx === 2 && !rejected, failed: rejected },
      { label: 'Approved',    icon: 'verified',    done: s === 'APPROVED',     active: false,                     failed: false    },
    ];
  }
}

