import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PerformanceService } from '../../services/performance.service';
import { PerformanceRecord, PerformanceStatus } from '../../models/performance-record.model';

interface PeriodOption { value: string; label: string; }
interface PerformanceSummary {
  overallScore: number | null;
  totalKpis: number;
  drafts: number;
  submitted: number;
  approved: number;
  rejected: number;
}

@Component({
  selector: 'app-performance-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './performance-list.html',
  styleUrl: './performance-list.css'
})
export class PerformanceList implements OnInit {
  private perfService = inject(PerformanceService);
  private router      = inject(Router);
  allRecords = signal<PerformanceRecord[]>([]);
  isLoading  = signal(true);
  error      = signal<string | null>(null);
  selectedPeriod = this.currentPeriod();
  selectedStatus = '';

  /** Client-side filter */
  get records(): PerformanceRecord[] {
    const all = this.allRecords();
    if (!Array.isArray(all)) return [];   // safety guard
    return all.filter(r => {
      if (this.selectedStatus && r.status !== this.selectedStatus) return false;
      // Period filter: only apply if the record has a period AND a period is selected
      if (this.selectedPeriod && r.period) {
        if (!r.period.startsWith(this.selectedPeriod)) return false;
      }
      return true;
    });
  }

  /** Computed summary from loaded records */
  summary = computed<PerformanceSummary | null>(() => {
    const recs = this.allRecords();
    if (!Array.isArray(recs) || !recs.length) return null;
    const scores = recs.map(r => r.score ?? r.achievementPct).filter((s): s is number => s != null);
    const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return {
      overallScore,
      totalKpis:  recs.length,
      drafts:     recs.filter(r => r.status === 'DRAFT').length,
      submitted:  recs.filter(r => r.status === 'SUBMITTED').length,
      approved:   recs.filter(r => r.status === 'APPROVED').length,
      rejected:   recs.filter(r => r.status === 'REJECTED').length,
    };
  });

  get total(): number { return this.records.length; }

  get periodOptions(): PeriodOption[] {
    const opts: PeriodOption[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      opts.push({ value: v, label: d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) });
    }
    return opts;
  }

  private currentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.perfService.getMyPerformance({ page: 0, size: 200 }).subscribe({
      next: records => { this.allRecords.set(records); this.isLoading.set(false); },
      error: err => {
        const msg = err.status === 0   ? 'Cannot connect to server. Is the backend running?'
                  : err.status === 500 ? 'Server error (HTTP 500). Please check the backend logs.'
                  : `Failed to load performance data (HTTP ${err.status}).`;
        this.error.set(msg);
        this.isLoading.set(false);
      }
    });
  }

  onPeriodChange(e: Event): void { this.selectedPeriod = (e.target as HTMLSelectElement).value; }
  onStatusFilter(s: string): void { this.selectedStatus = this.selectedStatus === s ? '' : s; }
  openRecord(r: PerformanceRecord): void { this.router.navigate(['/performance', r.id]); }
  captureKpi(r: PerformanceRecord): void { this.router.navigate(['/performance', r.id, 'edit']); }
  newCapture(): void { this.router.navigate(['/performance/new']); }

  statusBadge(s: PerformanceStatus): string {
    const m: Record<string, string> = {
      DRAFT: 'badge-gray', SUBMITTED: 'badge-warning', REVIEWED: 'badge-info',
      APPROVED: 'badge-success', REJECTED: 'badge-danger'
    };
    return m[s] ?? 'badge-gray';
  }

  statusLabel(s: PerformanceStatus): string {
    const m: Record<string, string> = {
      DRAFT: 'Draft', SUBMITTED: 'Submitted', REVIEWED: 'Under Review',
      APPROVED: 'Approved', REJECTED: 'Rejected'
    };
    return m[s] ?? s;
  }

  achievementColor(pct?: number | null): string {
    if (pct == null) return 'gray';
    if (pct >= 100) return 'green'; if (pct >= 75) return 'blue'; if (pct >= 50) return 'orange'; return 'red';
  }

  canCapture(r: PerformanceRecord): boolean { return ['DRAFT', 'REJECTED'].includes(r.status); }
}
