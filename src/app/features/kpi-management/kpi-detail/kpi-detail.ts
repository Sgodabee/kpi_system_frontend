import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, TitleCasePipe, DecimalPipe } from '@angular/common';
import { KpiService }            from '../../../core/services/kpi.service';
import { KpiAssignmentService }  from '../../../core/services/kpi-assignment.service';
import { AuthService }           from '../../../core/auth/auth.service';
import { Kpi, KpiType, KpiStatus } from '../../../core/models/kpi.model';
import { KpiAssignment }         from '../../../core/models/kpi-assignment.model';

type KpiTab = 'overview' | 'assignments' | 'performance';

@Component({
  selector: 'app-kpi-detail',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, DecimalPipe],
  templateUrl: './kpi-detail.html',
  styleUrl:    './kpi-detail.css'
})
export class KpiDetail implements OnInit {
  private route          = inject(ActivatedRoute);
  private kpiService     = inject(KpiService);
  private assnService    = inject(KpiAssignmentService);
  private authService    = inject(AuthService);
  private location       = inject(Location);

  kpi         = signal<Kpi | null>(null);
  assignments = signal<KpiAssignment[]>([]);
  isLoading   = signal(true);
  assnLoading = signal(false);
  error       = signal<string | null>(null);
  activeTab   = signal<KpiTab>('overview');

  tabs: { key: KpiTab; label: string; icon: string }[] = [
    { key: 'overview',     label: 'Overview',     icon: 'info'         },
    { key: 'assignments',  label: 'Assignments',  icon: 'assignment_ind'},
    { key: 'performance',  label: 'Performance',  icon: 'trending_up'  }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => this.load(Number(p.get('id'))));
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.kpiService.getById(id).subscribe({
      next:  k  => { this.kpi.set(k); this.isLoading.set(false); },
      error: err => {
        this.error.set(err.status === 404 ? 'KPI not found.' : 'Failed to load KPI.');
        this.isLoading.set(false);
      }
    });
  }

  loadAssignments(): void {
    const id = this.kpi()?.id;
    if (!id) return;
    this.assnLoading.set(true);
    /** GET /api/v1/kpi/assignments?kpiDefinitionId={id} — filter client-side by kpiDefinitionId */
    this.assnService.getAll({ assigneeId: undefined }).subscribe({
      next:  list => {
        // API has no kpiDefinitionId filter — filter client-side
        this.assignments.set(list.filter(a => a.kpiDefinitionId === id || a.kpiId === id));
        this.assnLoading.set(false);
      },
      error: () => this.assnLoading.set(false)
    });
  }

  setTab(tab: KpiTab): void {
    this.activeTab.set(tab);
    if (tab === 'assignments' && this.assignments().length === 0) this.loadAssignments();
  }

  goBack(): void { this.location.back(); }

  typeBadge(type?: KpiType): string {
    return type === 'QUANTITATIVE' ? 'badge-primary' : 'badge-purple';
  }
  typeLabel(type?: KpiType): string {
    return type === 'QUANTITATIVE' ? 'Quantitative' : 'Qualitative';
  }
  statusBadge(status?: KpiStatus): string {
    if (status === 'ACTIVE') return 'badge-success';
    if (status === 'DRAFT')  return 'badge-warning';
    return 'badge-gray';
  }
  assnStatusBadge(status: string): string {
    const map: Record<string, string> = {
      DRAFT:     'badge-gray',
      ACTIVE:    'badge-primary',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return map[status] ?? 'badge-gray';
  }
  achievementColor(pct?: number): string {
    if (!pct) return 'gray';
    if (pct >= 100) return 'green';
    if (pct >= 75)  return 'blue';
    if (pct >= 50)  return 'orange';
    return 'red';
  }
}



