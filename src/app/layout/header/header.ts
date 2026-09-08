import { Component, HostListener, inject, output, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private authService = inject(AuthService);
  menuToggle = output<void>();
  currentUser = this.authService.currentUser;

  searchOpen  = signal(false);
  dropdownOpen = signal(false);
  notifCount   = signal(3);   // mock

  get userInitials(): string {
    const name = this.currentUser()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
  get primaryRole(): string {
    const roles = this.currentUser()?.roles ?? [];
    const has = (...r: string[]) => roles.some(x => r.includes(x));
    if (has('ROLE_ADMIN', 'ADMIN', 'ROLE_SYSTEM_ADMIN', 'SYSTEM_ADMIN'))             return 'Administrator';
    if (has('ROLE_MUNICIPAL_MANAGER', 'MUNICIPAL_MANAGER'))                           return 'Municipal Manager';
    if (has('ROLE_DIRECTOR', 'DIRECTOR'))                                             return 'Director';
    if (has('ROLE_MANAGER', 'MANAGER'))                                               return 'Manager';
    if (has('ROLE_HR', 'HR', 'HR_MODERATOR', 'ROLE_HR_MODERATOR'))                   return 'HR Officer';
    if (has('ROLE_EMPLOYEE', 'EMPLOYEE'))                                             return 'Employee';
    // Infer from permissions if roles are empty/unrecognised
    const perms = this.currentUser()?.permissions ?? [];
    if (perms.includes('ADMIN'))                                                      return 'Administrator';
    if (perms.some(p => ['KPI_REVIEW', 'REVIEW_APPROVE', 'KPI_APPROVE'].includes(p))) return 'Manager';
    if (perms.some(p => ['KPI_SUBMIT'].includes(p)))                                  return 'Employee';
    // Last resort: clean up and display the raw role value
    const raw = roles[0];
    if (raw) return raw.replace(/^ROLE_/, '').split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
    return 'Employee';
  }

  onMenuToggle():    void { this.menuToggle.emit(); }
  toggleSearch():    void { this.searchOpen.update(v => !v); }
  toggleDropdown():  void { this.dropdownOpen.update(v => !v); }
  logout():          void { this.authService.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.hd-user-wrap')) {
      this.dropdownOpen.set(false);
    }
    if (!(e.target as HTMLElement).closest('.hd-search-wrap')) {
      this.searchOpen.set(false);
    }
  }
}
