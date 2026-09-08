import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewComment } from '../../models/performance-review';

@Component({
  selector: 'review-comments',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rc-section">
      <h3 class="rc-title">
        <span class="material-symbols-rounded">chat</span>
        Comments
      </h3>

      @if (items().length === 0) {
        <p class="rc-empty">No comments yet.</p>
      } @else {
        <ul class="rc-list">
          @for (c of items(); track c.id) {
            <li class="rc-item" [class.rc-item--system]="c.isSystemMessage">
              @if (!c.isSystemMessage) {
                <span class="rc-avatar">{{ initials(c.authorName) }}</span>
              } @else {
                <span class="rc-sys-icon material-symbols-rounded">info</span>
              }
              <div class="rc-body">
                <div class="rc-meta">
                  <span class="rc-author">{{ c.authorName }}</span>
                  @if (c.authorRole) { <span class="rc-role">{{ c.authorRole }}</span> }
                  @if (c.createdAt)  { <span class="rc-time">{{ formatDate(c.createdAt) }}</span> }
                </div>
                <p class="rc-content">{{ c.content }}</p>
              </div>
            </li>
          }
        </ul>
      }

      @if (!readonly()) {
        <div class="rc-compose">
          <textarea class="rc-input" rows="3"
                    placeholder="Add a comment… (Ctrl+Enter to submit)"
                    [(ngModel)]="draft"
                    (keydown.control.enter)="submit()"></textarea>
          <button class="rc-send" [disabled]="!draft.trim()" (click)="submit()">
            <span class="material-symbols-rounded">send</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .rc-section { }
    .rc-title { display: flex; align-items: center; gap: .45rem; font-size: .875rem; font-weight: 600;
                color: #111827; margin: 0 0 .75rem; }
    .rc-title .material-symbols-rounded { font-size: 1.1rem; color: #6b7280; }
    .rc-empty { font-size: .8rem; color: #9ca3af; font-style: italic; }
    .rc-list  { list-style: none; padding: 0; margin: 0 0 1rem; display: flex; flex-direction: column; gap: .75rem; }
    .rc-item  { display: flex; gap: .6rem; align-items: flex-start; }
    .rc-item--system .rc-body { background: #f0fdf4; border-color: #bbf7d0; }
    .rc-avatar  { width: 2rem; height: 2rem; border-radius: 50%; background: #3b82f6;
                  color: #fff; font-size: .7rem; font-weight: 700; display: flex;
                  align-items: center; justify-content: center; flex-shrink: 0; }
    .rc-sys-icon { font-size: 1.25rem; color: #16a34a; margin-top: .15rem; flex-shrink: 0; }
    .rc-body    { flex: 1; padding: .5rem .75rem; background: #f9fafb;
                  border: 1px solid #e5e7eb; border-radius: .5rem; }
    .rc-meta    { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-bottom: .25rem; }
    .rc-author  { font-size: .8rem; font-weight: 600; color: #111827; }
    .rc-role    { font-size: .7rem; color: #6b7280; background: #f3f4f6; padding: .1rem .4rem; border-radius: 99px; }
    .rc-time    { font-size: .7rem; color: #9ca3af; margin-left: auto; }
    .rc-content { margin: 0; font-size: .8rem; color: #374151; white-space: pre-wrap; }
    .rc-compose { display: flex; gap: .5rem; align-items: flex-end; }
    .rc-input   { flex: 1; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: .5rem;
                  font-size: .875rem; font-family: inherit; resize: vertical; min-height: 56px;
                  transition: border-color .15s; }
    .rc-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
    .rc-send    { width: 2.25rem; height: 2.25rem; border-radius: 50%; border: none;
                  background: #3b82f6; color: #fff; cursor: pointer; display: flex;
                  align-items: center; justify-content: center; flex-shrink: 0; transition: background .15s; }
    .rc-send:disabled { background: #9ca3af; cursor: not-allowed; }
    .rc-send:hover:not(:disabled) { background: #2563eb; }
    .rc-send .material-symbols-rounded { font-size: 1rem; }
  `],
})
export class ReviewComments {
  items    = input<ReviewComment[]>([]);
  readonly = input(false);

  add = output<string>();

  draft = '';

  submit(): void {
    const content = this.draft.trim();
    if (!content) return;
    this.add.emit(content);
    this.draft = '';
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }
}

