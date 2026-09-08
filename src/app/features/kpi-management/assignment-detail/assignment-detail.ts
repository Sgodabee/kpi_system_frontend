import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, TitleCasePipe, DatePipe, DecimalPipe } from '@angular/common';
import { switchMap, of } from 'rxjs';
import { KpiAssignmentService } from '../../../core/services/kpi-assignment.service';
import { EmployeeService }      from '../../../core/services/employee.service';
import { AuthService }          from '../../../core/auth/auth.service';
import { KpiAssignment, AssignmentStatus } from '../../../core/models/kpi-assignment.model';

interface WorkflowStep {
  status:  AssignmentStatus;
  label:   string;
  icon:    string;
  done:    boolean;
  active:  boolean;
}

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, DatePipe, DecimalPipe],
  templateUrl: './assignment-detail.html',
  styleUrl:    './assignment-detail.css'
})
export class AssignmentDetail implements OnInit {
  private route             = inject(ActivatedRoute);
  private assignmentService = inject(KpiAssignmentService);
  private employeeService   = inject(EmployeeService);
  private authService       = inject(AuthService);
  private location          = inject(Location);

  assignment = signal<KpiAssignment | null>(null);
  isLoading  = signal(true);
  error      = signal<string | null>(null);
  actionBusy = signal(false);
  activeTab  = signal<'overview'|'evidence'|'comments'>('overview');

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => this.load(Number(p.get('id'))));
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.assignmentService.getById(id).pipe(
      switchMap(a => {
        // Normalise API field names
        if (!a.kpiName && a.kpiDefinitionName) a.kpiName = a.kpiDefinitionName;
        if (!a.kpiCode && a.kpiDefinitionCode) a.kpiCode = a.kpiDefinitionCode;
        // Use createdAt as assignedDate fallback
        if (!a.assignedDate && a.createdAt) a.assignedDate = a.createdAt;

        // Fetch employee details for EMPLOYEE assignees
        if (a.assigneeType === 'EMPLOYEE' && a.assigneeId && !a.employeeName) {
          return this.employeeService.getById(a.assigneeId).pipe(
            switchMap(emp => {
              a.employeeId     = emp.id;
              a.employeeName   = emp.fullName ?? `${emp.firstName} ${emp.lastName}`;
              a.departmentId   = emp.departmentId;
              a.departmentName = emp.departmentName;
              a.divisionName   = emp.divisionName;
              return of(a);
            })
          );
        }
        return of(a);
      })
    ).subscribe({
      next:  a  => { this.assignment.set(a); this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 404 ? 'Assignment not found.' : 'Failed to load assignment.');
        this.isLoading.set(false);
      }
    });
  }

  /** Workflow: DRAFT → ACTIVE → COMPLETED  (CANCELLED is an exit state) */
  get workflowSteps(): WorkflowStep[] {
    const status = this.assignment()?.status;
    const ORDER: AssignmentStatus[] = ['DRAFT', 'ACTIVE', 'COMPLETED'];
    const currentIdx = ORDER.indexOf(status as AssignmentStatus);

    return [
      { status: 'DRAFT',     label: 'Draft',     icon: 'edit_note',      done: currentIdx > 0,  active: currentIdx === 0 },
      { status: 'ACTIVE',    label: 'Active',    icon: 'pending_actions', done: currentIdx > 1,  active: currentIdx === 1 },
      { status: 'COMPLETED', label: 'Completed', icon: 'check_circle',    done: currentIdx >= 2, active: currentIdx === 2 },
    ];
  }

  get canReview(): boolean {
    return this.authService.hasAnyPermission(['KPI_REVIEW', 'KPI_APPROVE', 'ADMIN']);
  }

  /** Manager can activate a DRAFT assignment */
  get canActivate(): boolean {
    return this.assignment()?.status === 'DRAFT' && this.canReview;
  }

  /** Manager/Admin can mark an ACTIVE assignment as completed */
  get canComplete(): boolean {
    return this.assignment()?.status === 'ACTIVE' && this.canReview;
  }

  /** Manager/Admin can cancel an assignment that isn't already done */
  get canCancel(): boolean {
    const s = this.assignment()?.status;
    return !!s && s !== 'COMPLETED' && s !== 'CANCELLED' && this.canReview;
  }

  get isCancelled(): boolean {
    return this.assignment()?.status === 'CANCELLED';
  }

  /** Activate: DRAFT → ACTIVE */
  activate(): void {
    const id = this.assignment()?.id; if (!id) return;
    this.actionBusy.set(true);
    this.assignmentService.activate(id).subscribe({
      next:  a  => { this.assignment.set(a); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  /** Complete: ACTIVE → COMPLETED */
  complete(): void {
    const a = this.assignment(); if (!a?.id) return;
    if (!confirm('Mark this KPI assignment as completed?')) return;
    this.actionBusy.set(true);
    this.assignmentService.complete(a.id, a).subscribe({
      next:  updated => { this.assignment.set(updated); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  /** Cancel the assignment */
  cancel(): void {
    const id = this.assignment()?.id; if (!id) return;
    if (!confirm('Cancel this KPI assignment?')) return;
    this.actionBusy.set(true);
    this.assignmentService.cancel(id).subscribe({
      next:  a  => { this.assignment.set(a); this.actionBusy.set(false); },
      error: () => this.actionBusy.set(false)
    });
  }

  goBack(): void { this.location.back(); }

  statusBadge(status?: AssignmentStatus | string): string {
    const map: Record<string, string> = {
      DRAFT:     'badge-gray',
      ACTIVE:    'badge-primary',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return map[status ?? ''] ?? 'badge-gray';
  }

  achievementColor(pct?: number): string {
    if (!pct)    return 'gray';
    if (pct >= 100) return 'green';
    if (pct >= 75)  return 'blue';
    if (pct >= 50)  return 'orange';
    return 'red';
  }
}
