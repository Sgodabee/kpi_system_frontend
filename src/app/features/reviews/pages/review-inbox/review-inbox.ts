import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ReviewService }     from '../../services/review.service';
import { AuthService }       from '../../../../core/auth/auth.service';
import { PerformanceService } from '../../../performance/services/performance.service';
import { EmployeeService }   from '../../../../core/services/employee.service';
import { Employee }          from '../../../../core/models/employee.model';
import {
  PerformanceReview, ReviewFilter, ReviewInboxStats, ReviewStatus,
} from '../../models/performance-review';

/** Extended review item — knows whether it came from performance or reviews */
interface InboxItem extends PerformanceReview {
  /** 'review' = formal review record | 'performance' = submitted perf record */
  _source: 'review' | 'performance';
  /** original performance record id for navigation */
  _perfId?: number;
  _kpiName?: string;
}

type TabKey = 'ALL' | 'PENDING' | 'OVERDUE' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-review-inbox',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './review-inbox.html',
  styleUrl: './review-inbox.css',
})
export class ReviewInbox implements OnInit {
  private reviewSvc  = inject(ReviewService);
  private perfSvc    = inject(PerformanceService);
  private empSvc     = inject(EmployeeService);
  private auth       = inject(AuthService);
  private router     = inject(Router);

  allReviews = signal<InboxItem[]>([]);
  isLoading  = signal(true);
  error      = signal<string | null>(null);

  /** Use signals so computed() reacts to tab/search changes */
  activeTab  = signal<TabKey>('ALL');
  searchText = signal('');

  /** Client-side filtered list */
  reviews = computed<InboxItem[]>(() => {
    let list = this.allReviews();
    if (this.activeTab() !== 'ALL') {
      list = list.filter(r => r.status === this.activeTab());
    }
    const q = this.searchText().trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.employeeName?.toLowerCase().includes(q) ||
        r.departmentName?.toLowerCase().includes(q) ||
        (r as any).employeeNumber?.toLowerCase().includes(q) ||
        r._kpiName?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  /** Computed stats from loaded data */
  stats = computed<ReviewInboxStats>(() => {
    const all = this.allReviews();
    return {
      pending:   all.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length,
      overdue:   all.filter(r => r.status === 'OVERDUE').length,
      completed: all.filter(r => r.status === 'APPROVED').length,
      rejected:  all.filter(r => r.status === 'REJECTED').length,
    };
  });

  get total(): number { return this.reviews().length; }

  readonly tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'ALL',      label: 'All',       icon: 'list' },
    { key: 'PENDING',  label: 'Pending',   icon: 'pending' },
    { key: 'OVERDUE',  label: 'Overdue',   icon: 'warning' },
    { key: 'APPROVED', label: 'Completed', icon: 'check_circle' },
    { key: 'REJECTED', label: 'Rejected',  icon: 'cancel' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const year = new Date().getFullYear();

    // Load both formal reviews AND submitted/reviewed performance records in parallel
    // Also load employees so we can resolve names (PerformanceResponse has no employeeName)
    forkJoin({
      reviews:   this.reviewSvc.getAll({ year }),
      submitted: this.perfSvc.getAll({ status: 'SUBMITTED', size: 200 }),
      reviewed:  this.perfSvc.getAll({ status: 'REVIEWED',  size: 200 }),
      approved:  this.perfSvc.getAll({ status: 'APPROVED',  size: 200 }),
      rejected:  this.perfSvc.getAll({ status: 'REJECTED',  size: 200 }),
      employees: this.empSvc.getAll({ size: 500 }),
    }).subscribe({
      next: ({ reviews, submitted, reviewed, approved, rejected, employees }) => {
        // Build employee lookup map: id → Employee
        const empMap = new Map<number, Employee>();
        (employees.content ?? []).forEach((e: Employee) => empMap.set(e.id, e));

        // Collect performance-record IDs already covered by formal reviews
        const coveredPerfIds = new Set(
          reviews.map(r => (r as any).performanceRecordId).filter(Boolean)
        );

        // Map formal reviews
        const reviewItems: InboxItem[] = reviews.map(r => ({
          ...r, _source: 'review' as const,
        }));

        // Map submitted performance records not already in a formal review
        const perfStatusMap: Record<string, ReviewStatus> = {
          SUBMITTED: 'PENDING',
          REVIEWED:  'IN_PROGRESS',
          APPROVED:  'APPROVED',
          REJECTED:  'REJECTED',
        };

        const perfItems: InboxItem[] = [...submitted, ...reviewed, ...approved, ...rejected]
          .filter(p => !coveredPerfIds.has(p.id))
          .map(p => {
            // Resolve employee name and department from the employee lookup map
            const emp = (p.assigneeId ?? p.employeeId)
              ? empMap.get((p.assigneeId ?? p.employeeId)!)
              : undefined;
            const empName = p.employeeName
              ?? (emp ? `${emp.firstName} ${emp.lastName}`.trim() : 'Unknown');
            const deptName = p.departmentName ?? emp?.departmentName ?? '';
            return {
              id:             p.id,
              employeeName:   empName,
              employeeNumber: emp?.employeeNumber,
              positionTitle:  emp?.positionName ?? emp?.positionTitle,
              departmentName: deptName,
              overallScore:   p.score ?? p.achievementPct ?? undefined,
              status:         perfStatusMap[p.status] ?? 'PENDING',
              currentStep:    'MANAGER_REVIEW' as const,
              submittedAt:    p.submittedAt ?? p.createdAt,
              _source:        'performance' as const,
              _perfId:        p.id,
              _kpiName:       p.kpiDefinitionName ?? p.kpiName,
            };
          });

        this.allReviews.set([...reviewItems, ...perfItems]);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.status === 0
          ? 'Cannot connect to server. Is the backend running?'
          : `Failed to load reviews (HTTP ${err.status}).`);
        this.isLoading.set(false);
      },
    });
  }

  selectTab(tab: TabKey): void { this.activeTab.set(tab); }

  onSearch(e: Event): void { this.searchText.set((e.target as HTMLInputElement).value); }

  openReview(r: InboxItem): void {
    if (r._source === 'performance') {
      this.router.navigate(['/performance', r._perfId ?? r.id]);
    } else {
      this.router.navigate(['/reviews', r.id]);
    }
  }

  statusBadge(s: ReviewStatus): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning', IN_PROGRESS: 'badge-warning',
      APPROVED: 'badge-success', REJECTED: 'badge-danger',
      REVISION_REQUESTED: 'badge-danger', OVERDUE: 'badge-overdue',
    };
    return map[s] ?? 'badge-gray';
  }

  statusLabel(s: ReviewStatus): string {
    const map: Record<string, string> = {
      PENDING: 'Pending', IN_PROGRESS: 'In Progress',
      APPROVED: 'Approved', REJECTED: 'Rejected',
      REVISION_REQUESTED: 'Revision Req.', OVERDUE: 'Overdue',
    };
    return map[s] ?? s;
  }

  scoreColor(score?: number | null): string {
    if (score == null) return 'gray';
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 50) return 'orange';
    return 'red';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }); }
    catch { return iso; }
  }

  tabCount(key: TabKey): number | null {
    const s = this.stats();
    switch (key) {
      case 'PENDING':  return s.pending;
      case 'OVERDUE':  return s.overdue;
      case 'APPROVED': return s.completed;
      case 'REJECTED': return s.rejected;
      default: return null;
    }
  }
}
