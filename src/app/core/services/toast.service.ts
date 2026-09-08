import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:       number;
  type:     ToastType;
  title:    string;
  message?: string;
  duration: number;  // ms; 0 = sticky until dismissed
}

let _nextId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  // ── Public API ───────────────────────────────────────────────────────────

  success(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration = 6000): void {
    this.add({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration = 5000): void {
    this.add({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'info', title, message, duration });
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private add(toast: Omit<Toast, 'id'>): void {
    const id = ++_nextId;
    this._toasts.update(list => [...list, { ...toast, id }]);
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
  }
}

