import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauth-page">
      <div class="unauth-card">
        <div class="unauth-code">403</div>
        <div class="unauth-icon-ring">
          <span class="material-symbols-rounded unauth-icon">lock</span>
        </div>
        <h1 class="unauth-title">Access Denied</h1>
        <p class="unauth-desc">You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.</p>
        <a routerLink="/dashboard" class="unauth-btn">
          <span class="material-symbols-rounded" style="font-size:18px;">arrow_back</span>
          Back to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);
      padding: 24px; animation: fadeIn 0.4s ease both;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .unauth-card {
      background: rgba(255,255,255,0.04); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
      padding: 56px 48px; max-width: 480px; width: 100%; text-align: center;
      animation: scaleIn 0.5s ease both;
    }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
    .unauth-code {
      font-size: 6rem; font-weight: 900; line-height: 1;
      background: linear-gradient(135deg,#60a5fa,#a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin-bottom: 16px;
    }
    .unauth-icon-ring {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px;
      background: rgba(239,68,68,0.15); border: 2px solid rgba(239,68,68,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .unauth-icon { font-size: 34px; color: #f87171; }
    .unauth-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; }
    .unauth-desc  { color: #94a3b8; font-size: 0.9375rem; line-height: 1.7; margin-bottom: 28px; }
    .unauth-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg,#2563eb,#3b82f6);
      color: white; border-radius: 10px; padding: 12px 24px;
      font-weight: 600; font-size: 0.9375rem;
      box-shadow: 0 4px 14px rgba(37,99,235,0.4);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .unauth-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.5); }
  `]
})
export class Unauthorized {}
