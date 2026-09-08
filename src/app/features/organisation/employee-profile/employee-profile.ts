import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, TitleCasePipe, DatePipe } from '@angular/common';
import { EmployeeService }    from '../../../core/services/employee.service';
import { AuthService }        from '../../../core/auth/auth.service';
import { ReviewService }      from '../../reviews/services/review.service';
import { PerformanceService } from '../../performance/services/performance.service';
import { Employee }           from '../../../core/models/employee.model';

type EmpTab = 'overview' | 'kpis' | 'performance' | 'evidence' | 'reviews' | 'activity';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, DatePipe],
  templateUrl: './employee-profile.html',
  styleUrl:    './employee-profile.css'
})
export class EmployeeProfile implements OnInit {
  private route            = inject(ActivatedRoute);
  private empService       = inject(EmployeeService);
  private authService      = inject(AuthService);
  private reviewService    = inject(ReviewService);
  private perfService      = inject(PerformanceService);
  private router           = inject(Router);
  private location         = inject(Location);

  employee        = signal<Employee | null>(null);
  isLoading       = signal(true);
  error           = signal<string | null>(null);
  activeTab       = signal<EmpTab>('overview');
  isStartingReview = signal(false);
  reviewError     = signal<string | null>(null);

  tabs: { key: EmpTab; label: string; icon: string }[] = [
    { key: 'overview',     label: 'Overview',     icon: 'person'        },
    { key: 'kpis',         label: 'KPIs',         icon: 'task_alt'      },
    { key: 'performance',  label: 'Performance',  icon: 'trending_up'   },
    { key: 'evidence',     label: 'Evidence',     icon: 'attach_file'   },
    { key: 'reviews',      label: 'Reviews',      icon: 'rate_review'   },
    { key: 'activity',     label: 'Activity',     icon: 'history'       }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.load(Number(p.get('id')));
    });
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.empService.getById(id).subscribe({
      next:  emp => { this.employee.set(emp); this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 404 ? 'Employee not found.' : 'Failed to load employee.');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void { this.location.back(); }

  get initials(): string {
    const emp = this.employee();
    if (!emp) return '?';
    return ((emp.firstName[0] ?? '') + (emp.lastName[0] ?? '')).toUpperCase();
  }

  gaugeOffset(score?: number): number {
    const s = score ?? 0;
    return 2 * Math.PI * 54 * (1 - s / 100);
  }

  gaugeColor(score?: number): string {
    if (!score) return '#e2e8f0';
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#2563eb';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  scoreClass(score?: number): string {
    if (!score) return 'none';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  statusBadge(status: string): string {
    if (status === 'ACTIVE')    return 'badge-success';
    if (status === 'SUSPENDED') return 'badge-danger';
    return 'badge-gray';
  }

  startReview(): void {
    const emp  = this.employee();
    const user = this.authService.currentUser();
    if (!emp) return;

    this.isStartingReview.set(true);
    this.reviewError.set(null);

    const year = new Date().getFullYear();

    // Fetch the employee's submitted performance records for this year first
    this.perfService.getAll({ employeeId: emp.id, year, size: 200 }).subscribe({
      next: records => {
        // Client-side guard: keep only records that actually belong to this employee
        const empRecords = records.filter(r =>
          r.employeeId === emp.id ||
          (r.assigneeType === 'EMPLOYEE' && r.assigneeId === emp.id)
        );

        // Prefer SUBMITTED records; fall back to any of this employee's records
        const submitted = empRecords.filter(r => r.status === 'SUBMITTED');
        const recordIds = (submitted.length > 0 ? submitted : empRecords).map(r => r.id);

        if (recordIds.length === 0) {
          this.isStartingReview.set(false);
          this.reviewError.set('No submitted performance records found for this employee. Ask the employee to submit their performance first.');
          return;
        }

        this.reviewService.create({
          employeeId:           emp.id,
          reviewYear:           year,
          reviewPeriod:         'ANNUAL',
          createdById:          user?.id ?? 0,
          performanceRecordIds: recordIds,
        }).subscribe({
          next: review => {
            this.isStartingReview.set(false);
            this.router.navigate(['/reviews', review.id]);
          },
          error: err => {
            this.isStartingReview.set(false);
            this.reviewError.set(err.error?.message ?? err.error?.error ?? `Failed to start review (HTTP ${err.status})`);
          },
        });
      },
      error: () => {
        this.isStartingReview.set(false);
        this.reviewError.set('Could not load performance records. Please try again.');
      },
    });
  }

  get canReview(): boolean {
    return this.authService.hasAnyPermission(['KPI_REVIEW', 'KPI_APPROVE', 'ADMIN']);
  }
}

