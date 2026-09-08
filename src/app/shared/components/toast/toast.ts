import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}" role="alert">
          <span class="toast-icon material-symbols-rounded">{{ icon(t.type) }}</span>
          <div class="toast-body">
            <span class="toast-title">{{ t.title }}</span>
            @if (t.message) {
              <span class="toast-msg">{{ t.message }}</span>
            }
          </div>
          <button class="toast-close" (click)="toastSvc.dismiss(t.id)" aria-label="Dismiss">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.06);
      border-left: 4px solid transparent;
      pointer-events: all;
      animation: toast-in .25s cubic-bezier(.21,1.02,.73,1) both;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateX(24px) scale(.96); }
      to   { opacity: 1; transform: translateX(0)    scale(1);   }
    }

    .toast--success { border-left-color: #22c55e; }
    .toast--error   { border-left-color: #ef4444; }
    .toast--warning { border-left-color: #f59e0b; }
    .toast--info    { border-left-color: #3b82f6; }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .toast--success .toast-icon { color: #22c55e; }
    .toast--error   .toast-icon { color: #ef4444; }
    .toast--warning .toast-icon { color: #f59e0b; }
    .toast--info    .toast-icon { color: #3b82f6; }

    .toast-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .toast-title {
      font-size: .875rem;
      font-weight: 600;
      color: #111827;
      line-height: 1.3;
    }
    .toast-msg {
      font-size: .8rem;
      color: #6b7280;
      line-height: 1.4;
      word-break: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: #9ca3af;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color .15s;
    }
    .toast-close:hover { color: #374151; }
    .toast-close .material-symbols-rounded { font-size: 18px; }
  `]
})
export class AppToast {
  toastSvc = inject(ToastService);

  icon(type: Toast['type']): string {
    return { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' }[type];
  }
}

