import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReviewEvidence } from '../../models/performance-review';

@Component({
  selector: 'evidence-panel',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="ep-section">
      <h3 class="ep-title">
        <span class="material-symbols-rounded">attach_file</span>
        Evidence
      </h3>
      @if (items().length === 0) {
        <p class="ep-empty">No evidence files attached.</p>
      } @else {
        <ul class="ep-list">
          @for (item of items(); track item.id) {
            <li class="ep-item">
              <span class="ep-icon material-symbols-rounded">{{ fileIcon(item.contentType) }}</span>
              <span class="ep-name">{{ item.originalFileName ?? item.fileName }}</span>
              @if (item.fileSizeBytes) {
                <span class="ep-size">{{ (item.fileSizeBytes / 1024) | number:'1.0-0' }} KB</span>
              }
              @if (item.downloadUrl) {
                <a class="ep-view" [href]="item.downloadUrl" target="_blank" rel="noopener">
                  <span class="material-symbols-rounded">open_in_new</span>View
                </a>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .ep-section { }
    .ep-title { display: flex; align-items: center; gap: .45rem; font-size: .875rem; font-weight: 600;
                color: #111827; margin: 0 0 .75rem; }
    .ep-title .material-symbols-rounded { font-size: 1.1rem; color: #6b7280; }
    .ep-empty { font-size: .8rem; color: #9ca3af; font-style: italic; }
    .ep-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; }
    .ep-item  { display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem;
                background: #f9fafb; border: 1px solid #e5e7eb; border-radius: .5rem; font-size: .8rem; }
    .ep-icon  { font-size: 1.1rem; color: #6b7280; flex-shrink: 0; }
    .ep-name  { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                color: #374151; font-weight: 500; }
    .ep-size  { color: #9ca3af; flex-shrink: 0; }
    .ep-view  { display: inline-flex; align-items: center; gap: .2rem; font-size: .75rem; font-weight: 500;
                color: #2563eb; text-decoration: none; flex-shrink: 0; padding: .2rem .5rem;
                border-radius: .25rem; transition: background .12s; }
    .ep-view:hover { background: #eff6ff; }
    .ep-view .material-symbols-rounded { font-size: .9rem; }
  `],
})
export class EvidencePanel {
  items = input<ReviewEvidence[]>([]);

  fileIcon(contentType?: string): string {
    if (!contentType) return 'description';
    if (contentType.includes('pdf'))   return 'picture_as_pdf';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'table_chart';
    if (contentType.includes('word'))  return 'description';
    if (contentType.includes('image')) return 'image';
    return 'attach_file';
  }
}

