import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="ph-page">
      <div class="ph-card">
        <div class="ph-icon-wrap">
          <span class="material-symbols-rounded ph-icon">{{ icon }}</span>
        </div>
        <h1 class="ph-title">{{ title }}</h1>
        <p class="ph-desc">This module is under active development and will be available in an upcoming sprint.</p>
        <div class="ph-sprint">
          <span class="material-symbols-rounded" style="font-size:16px;">rocket_launch</span>
          {{ sprint }}
        </div>
        <div class="ph-features">
          @for (f of features; track f) {
            <span class="ph-chip">{{ f }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ph-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 40px 24px;
      animation: fadeInUp 0.5s ease both;
    }
    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .ph-card {
      background: #fff; border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
      padding: 56px 48px; max-width: 520px; width: 100%; text-align: center;
    }
    .ph-icon-wrap {
      width: 88px; height: 88px; border-radius: 24px; margin: 0 auto 24px;
      background: linear-gradient(135deg,#eff6ff,#dbeafe);
      display: flex; align-items: center; justify-content: center;
    }
    .ph-icon { font-size: 42px; color: #2563eb; }
    .ph-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .ph-desc  { color: #64748b; font-size: 0.9375rem; line-height: 1.7; margin-bottom: 20px; }
    .ph-sprint {
      display: inline-flex; align-items: center; gap: 6px;
      background: #eff6ff; color: #1d4ed8; border-radius: 999px;
      padding: 6px 16px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 24px;
    }
    .ph-features { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .ph-chip {
      background: #f1f5f9; color: #475569; border-radius: 999px;
      padding: 4px 12px; font-size: 0.75rem; font-weight: 500;
    }
  `]
})
export class Placeholder {
  private route = inject(ActivatedRoute);

  get title():    string   { return this.route.snapshot.data['title']    ?? 'Coming Soon'; }
  get icon():     string   { return this.route.snapshot.data['icon']     ?? 'construction'; }
  get sprint():   string   { return this.route.snapshot.data['sprint']   ?? 'Upcoming Sprint'; }
  get features(): string[] { return this.route.snapshot.data['features'] ?? []; }
}

