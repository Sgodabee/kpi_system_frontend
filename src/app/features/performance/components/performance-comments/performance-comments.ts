import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PerformanceCommentService } from '../../services/performance-comment.service';
import { AuthService }               from '../../../../core/auth/auth.service';
import { PerformanceComment }        from '../../models/performance-comment.model';

@Component({
  selector: 'performance-comments',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<div class="pco-root">
  <!-- Header -->
  <div class="pco-header">
    <span class="material-symbols-rounded" style="font-size:18px;color:var(--primary)">comment</span>
    <h4 class="pco-title">Comments {{ comments().length > 0 ? '(' + comments().length + ')' : '' }}</h4>
  </div>

  <!-- Loading -->
  @if (isLoading()) {
    <div class="pco-loading">
      @for (s of [1,2]; track s) { <div class="skeleton" style="height:60px;border-radius:10px;margin-bottom:8px"></div> }
    </div>
  }

  <!-- Comment thread -->
  @if (!isLoading()) {
    @if (comments().length === 0) {
      <p class="pco-empty">No comments yet. Be the first to add one.</p>
    } @else {
      <div class="pco-thread">
        @for (c of comments(); track c.id) {
          <div class="pco-comment" [class.system]="c.isSystemMessage">
            <div class="pco-avatar">{{ getInitial(c.authorName) }}</div>
            <div class="pco-body">
              <div class="pco-meta">
                <span class="pco-author">{{ c.authorName ?? 'System' }}</span>
                @if (c.authorRole) {
                  <span class="pco-role">{{ c.authorRole }}</span>
                }
                @if (c.createdAt) {
                  <span class="pco-time">{{ c.createdAt | date:'dd MMM HH:mm' }}</span>
                }
              </div>
              <p class="pco-content">{{ c.content }}</p>
            </div>
          </div>
        }
      </div>
    }

    <!-- Add comment -->
    @if (!readonly) {
      <div class="pco-input-row">
        <div class="pco-avatar pco-me">{{ myInitial }}</div>
        <div class="pco-input-wrap">
          <textarea class="pco-textarea" rows="2"
                    [(ngModel)]="newComment"
                    placeholder="Add a comment…"
                    (keydown.ctrl.enter)="submit()"></textarea>
          <div class="pco-input-footer">
            <span class="pco-hint">Ctrl+Enter to submit</span>
            <button class="btn-primary" style="padding:7px 16px;font-size:0.8125rem"
                    [disabled]="!newComment.trim() || isSubmitting()"
                    (click)="submit()">
              @if (isSubmitting()) {
                <span class="lc-spinner" style="width:14px;height:14px;border-width:1.5px"></span>
              } @else {
                <span class="material-symbols-rounded" style="font-size:16px">send</span>
              }
              Post
            </button>
          </div>
        </div>
      </div>
    }
  }
</div>
  `,
  styles: [`
.pco-root { display: flex; flex-direction: column; gap: 14px; }
.pco-header { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
.pco-title  { font-size: 0.9375rem; font-weight: 700; color: var(--gray-900); margin: 0; }
.pco-empty  { font-size: 0.875rem; color: var(--text-secondary); text-align: center; padding: 20px; margin: 0; }
.pco-thread { display: flex; flex-direction: column; gap: 14px; }
.pco-comment { display: flex; gap: 12px; align-items: flex-start; }
.pco-comment.system { opacity: 0.7; }
.pco-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#2563eb,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0; text-transform: uppercase; }
.pco-avatar.pco-me { background: linear-gradient(135deg,#059669,#10b981); }
.pco-body   { flex: 1; background: var(--gray-50); border-radius: 10px; padding: 10px 14px; }
.pco-meta   { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.pco-author { font-size: 0.8125rem; font-weight: 700; color: var(--gray-900); }
.pco-role   { font-size: 0.72rem; color: var(--primary); background: var(--primary-50); padding: 1px 7px; border-radius: 999px; font-weight: 600; }
.pco-time   { font-size: 0.72rem; color: var(--text-muted); margin-left: auto; }
.pco-content { font-size: 0.875rem; color: var(--text-primary); line-height: 1.5; margin: 0; }
.pco-input-row { display: flex; gap: 12px; align-items: flex-start; margin-top: 4px; }
.pco-input-wrap { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.pco-textarea { width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 10px 14px; font-size: 0.875rem; font-family: inherit; resize: none; outline: none; transition: all .15s; }
.pco-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }
.pco-input-footer { display: flex; align-items: center; justify-content: space-between; }
.pco-hint   { font-size: 0.72rem; color: var(--text-muted); }
@keyframes spin { to { transform: rotate(360deg); } }
.lc-spinner { display: inline-block; border-radius: 50%; border: 2px solid rgba(255,255,255,.3); border-top-color: white; animation: spin .7s linear infinite; }
  `]
})
export class PerformanceComments implements OnChanges {
  private commentService = inject(PerformanceCommentService);
  private authService    = inject(AuthService);

  @Input() recordId!: number;
  @Input() readonly = false;

  comments    = signal<PerformanceComment[]>([]);
  isLoading   = signal(false);
  isSubmitting= signal(false);
  newComment  = '';

  get myInitial(): string {
    const name = this.authService.currentUser()?.fullName ?? 'Me';
    return name.charAt(0).toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordId'] && this.recordId) this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.commentService.getByRecord(this.recordId).subscribe({
      next:  c  => { this.comments.set(c); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  submit(): void {
    const text = this.newComment.trim();
    if (!text) return;
    this.isSubmitting.set(true);
    const authorId = this.authService.currentUser()?.id ?? 0;
    this.commentService.add(this.recordId, text, authorId).subscribe({
      next: c => {
        this.comments.update(list => [...list, c]);
        this.newComment = '';
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  getInitial(name?: string): string {
    return (name ?? '?').charAt(0).toUpperCase();
  }
}

