import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header }    from '../header/header';
import { Sidebar }   from '../sidebar/sidebar';
import { AppToast }  from '../../shared/components/toast/toast';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Header, Sidebar, AppToast],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell {
  sidebarCollapsed = signal(false);
  isMobile = window.innerWidth <= 768;

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  closeOnOverlay(): void {
    if (this.isMobile) this.sidebarCollapsed.set(true);
  }
}
