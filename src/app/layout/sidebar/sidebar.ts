import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NavSection } from '../../core/models/nav-item.model';
import { ReviewService } from '../../features/reviews/services/review.service';

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',      icon: 'dashboard',         route: '/dashboard', exact: true }
    ]
  },
  {
    title: 'Organisation',
    items: [
      { label: 'Departments',    icon: 'account_tree',      route: '/departments' },
      { label: 'Employees',      icon: 'people',            route: '/employees' }
    ]
  },
  {
    title: 'KPI System',
    items: [
      // KPI Library & Assignments — managers / admins only
      { label: 'KPI Library',    icon: 'library_books',     route: '/kpis',         permissions: ['KPI_MANAGE'] },
      { label: 'Assignments',    icon: 'assignment_ind',    route: '/assignments',  permissions: ['KPI_MANAGE'] },
      // Performance — ALL authenticated users (no permission gate)
      { label: 'Performance',    icon: 'trending_up',       route: '/performance'   },
      // Reviews — users who can review (managers, directors, HR, etc.)
      { label: 'Reviews',        icon: 'rate_review',       route: '/reviews',      permissions: ['KPI_REVIEW'] }
    ]
  },
  {
    title: 'Analytics',
    items: [
      // Reports — ALL authenticated users
      { label: 'Reports',        icon: 'analytics',         route: '/reports'       },
      { label: 'Workflows',      icon: 'workspaces',        route: '/workflows',    permissions: ['KPI_REVIEW'] }
    ]
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications',  icon: 'notifications',     route: '/notifications' },
      { label: 'Administration', icon: 'admin_panel_settings', route: '/admin',     permissions: ['ADMIN'] },
      { label: 'Audit Trail',    icon: 'history',           route: '/audit',        permissions: ['ADMIN'] }
    ]
  }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  private reviewSvc   = inject(ReviewService);

  collapsed   = input<boolean>(false);
  currentUser = this.authService.currentUser;

  /** Live badge counts keyed by route */
  badgeCounts = signal<Record<string, number>>({});

  ngOnInit(): void {
    // Load pending review count for users who can review
    // Uses getByYear() — no /stats endpoint needed
    if (this.authService.hasAnyPermission(['KPI_REVIEW', 'ADMIN'])) {
      this.reviewSvc.getAll({ size: 100 }).subscribe({
        next: reviews => {
          const pending = reviews.filter(r =>
            ['OPEN', 'PENDING', 'IN_PROGRESS', 'MANAGER_ASSESSED',
             'DIRECTOR_ASSESSED', 'HR_MODERATED'].includes(r.status as string)
          ).length;
          if (pending > 0) this.badgeCounts.set({ '/reviews': pending });
        },
        error: () => { /* badge is optional */ }
      });
    }
  }

  getBadge(route: string): number | null {
    return this.badgeCounts()[route] ?? null;
  }

  get visibleSections(): NavSection[] {
    return NAV_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.permissions?.length) return true;
        return this.authService.hasAnyPermission(item.permissions);
      })
    })).filter(section => section.items.length > 0);
  }

  get userInitial(): string {
    return this.currentUser()?.fullName?.charAt(0)?.toUpperCase() ?? '?';
  }

  get primaryRole(): string {
    const roles = this.currentUser()?.roles ?? [];
    const has = (...r: string[]) => roles.some(x => r.includes(x));
    if (has('ROLE_ADMIN',             'ADMIN'))             return 'Administrator';
    if (has('ROLE_MUNICIPAL_MANAGER', 'MUNICIPAL_MANAGER')) return 'Municipal Manager';
    if (has('ROLE_DIRECTOR',          'DIRECTOR'))          return 'Director';
    if (has('ROLE_MANAGER',           'MANAGER'))           return 'Manager';
    if (has('ROLE_HR',                'HR'))                return 'HR Officer';
    if (has('ROLE_EMPLOYEE',          'EMPLOYEE'))          return 'Employee';
    // Infer from permissions if roles are missing
    const perms = this.currentUser()?.permissions ?? [];
    if (perms.some(p => ['KPI_REVIEW','REVIEW_APPROVE'].includes(p))) return 'Manager';
    if (perms.some(p => ['KPI_SUBMIT'].includes(p)))                  return 'Employee';
    return roles[0]?.replace(/^ROLE_/, '') || 'Employee';
  }

  logout(): void { this.authService.logout(); }
}
