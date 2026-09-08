import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

const ph = (title: string, icon: string, sprint: string, features: string[] = [], permissions?: string[]) => ({
  loadComponent: () => import('./features/placeholder/placeholder').then(m => m.Placeholder),
  data: { title, icon, sprint, features, ...(permissions ? { permissions } : {}) },
  ...(permissions ? { canActivate: [authGuard] } : {})
});

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized').then(m => m.Unauthorized)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then(m => m.Shell),
    canActivate: [authGuard],
    children: [
      // ── Dashboard ───────────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },

      // ── Organisation ────────────────────────────────────────
      {
        path: 'departments',
        loadComponent: () => import('./features/organisation/org-overview/org-overview').then(m => m.OrgOverview)
      },
      {
        path: 'departments/:id',
        loadComponent: () => import('./features/organisation/department-detail/department-detail').then(m => m.DepartmentDetail)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/organisation/employee-list/employee-list').then(m => m.EmployeeList)
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/organisation/employee-profile/employee-profile').then(m => m.EmployeeProfile)
      },

      // ── Performance (F5) ────────────────────────────────────
      {
        path: 'performance',
        loadComponent: () => import('./features/performance/pages/performance-list/performance-list').then(m => m.PerformanceList)
      },
      {
        path: 'performance/new',
        loadComponent: () => import('./features/performance/pages/performance-capture/performance-capture').then(m => m.PerformanceCapture)
      },
      {
        path: 'performance/:id',
        loadComponent: () => import('./features/performance/pages/performance-detail/performance-detail').then(m => m.PerformanceDetail)
      },
      {
        path: 'performance/:id/edit',
        loadComponent: () => import('./features/performance/pages/performance-capture/performance-capture').then(m => m.PerformanceCapture)
      },
      {
        path: 'kpis', loadComponent: () => import('./features/kpi-management/kpi-library/kpi-library').then(m => m.KpiLibrary)
      },
      {
        path: 'kpis/:id',
        loadComponent: () => import('./features/kpi-management/kpi-detail/kpi-detail').then(m => m.KpiDetail)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./features/kpi-management/assignments/assignments').then(m => m.Assignments)
      },
      {
        path: 'assignments/:id',
        loadComponent: () => import('./features/kpi-management/assignment-detail/assignment-detail').then(m => m.AssignmentDetail)
      },
      {
        path: 'performance',
        ...ph('Performance', 'trending_up', 'Sprint F5 — Performance Capture',
          ['KPI Capture','Target vs Actual','Performance History'])
      },
      // ── Reviews & Approvals (F6) ──────────────────────────
      {
        path: 'reviews',
        loadComponent: () => import('./features/reviews/pages/review-inbox/review-inbox').then(m => m.ReviewInbox)
      },
      {
        path: 'reviews/:id',
        loadComponent: () => import('./features/reviews/pages/review-workspace/review-workspace').then(m => m.ReviewWorkspace)
      },
      {
        path: 'reviews/:id/detail',
        loadComponent: () => import('./features/reviews/pages/review-detail/review-detail').then(m => m.ReviewDetail)
      },
      {
        path: 'reviews/:id/history',
        loadComponent: () => import('./features/reviews/pages/review-history/review-history').then(m => m.ReviewHistory)
      },
      {
        path: 'evidence',
        ...ph('Evidence', 'attach_file', 'Sprint F5 — Performance Capture',
          ['Upload Evidence','Evidence Library','Approval Status'])
      },

      // ── Analytics ───────────────────────────────────────────
      {
        path: 'workflows',
        loadComponent: () => import('./features/workflows/pages/workflow-centre/workflow-centre').then(m => m.WorkflowCentre)
      },
      // ── Reports (F7) ────────────────────────────────────────
      { path: 'reports', loadComponent: () => import('./features/reports/pages/report-centre/report-centre').then(m => m.ReportCentre) },
      { path: 'reports/preview', loadComponent: () => import('./features/reports/pages/report-preview/report-preview').then(m => m.ReportPreview) },

      // ── System ──────────────────────────────────────────────
      {
        path: 'notifications',
        ...ph('Notifications', 'notifications', 'Sprint F8 — Administration',
          ['In-App Alerts','Email Templates','Notification History'])
      },
      // ── Administration (F8) ─────────────────────────────────
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/pages/admin-centre/admin-centre').then(m => m.AdminCentre),
        canActivate: [authGuard],
        data: { permissions: ['ADMIN'] }
      },
      // ── Audit Trail (F9) ────────────────────────────────────
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/pages/audit-trail/audit-trail').then(m => m.AuditTrail),
        canActivate: [authGuard],
        data: { permissions: ['ADMIN'] }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
