import { Component, input, output } from '@angular/core';

@Component({
  selector: 'approval-actions',
  standalone: true,
  template: `
    <div class="aa-bar">
      @if (canRequestRevision()) {
        <button class="aa-btn aa-btn--revision" [disabled]="isLoading()" (click)="revision.emit()">
          <span class="material-symbols-rounded">undo</span>
          Request Revision
        </button>
      }
      @if (canReject()) {
        <button class="aa-btn aa-btn--reject" [disabled]="isLoading()" (click)="reject.emit()">
          <span class="material-symbols-rounded">cancel</span>
          Reject
        </button>
      }
      @if (canApprove()) {
        <button class="aa-btn aa-btn--approve" [disabled]="isLoading()" (click)="approve.emit()">
          @if (isLoading()) {
            <span class="aa-spinner"></span>
          } @else {
            <span class="material-symbols-rounded">check_circle</span>
          }
          {{ approveLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .aa-bar { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
    .aa-btn { display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.1rem;
              border-radius: .5rem; font-size: .875rem; font-weight: 500; cursor: pointer;
              border: 1.5px solid transparent; transition: all .15s; }
    .aa-btn:disabled { opacity: .55; cursor: not-allowed; }
    .aa-btn .material-symbols-rounded { font-size: 1.1rem; }
    .aa-btn--revision { background: #fff; border-color: #d97706; color: #92400e; }
    .aa-btn--revision:hover:not(:disabled) { background: #fffbeb; }
    .aa-btn--reject   { background: #fff; border-color: #ef4444; color: #b91c1c; }
    .aa-btn--reject:hover:not(:disabled)   { background: #fef2f2; }
    .aa-btn--approve  { background: #22c55e; border-color: #22c55e; color: #fff; }
    .aa-btn--approve:hover:not(:disabled)  { background: #16a34a; border-color: #16a34a; }
    .aa-spinner { width: 1rem; height: 1rem; border-radius: 50%;
                  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
                  animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ApprovalActions {
  canApprove          = input(true);
  canReject           = input(true);
  canRequestRevision  = input(true);
  isLoading           = input(false);
  approveLabel        = input('Approve');

  approve  = output<void>();
  reject   = output<void>();
  revision = output<void>();
}

