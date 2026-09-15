import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, ChatbotComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly SIDEBAR_TRANSITION_MS = 320;
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  isSidebarCollapsed = false;
  isSidebarMobileOpen = false;



  showChatbot(): boolean {
    return this.authService.isDoctor() || this.authService.isFdo();
  }

  toggleMobileSidebar(): void {
    this.isSidebarMobileOpen = !this.isSidebarMobileOpen;
  }

  closeMobileSidebar(): void {
    this.isSidebarMobileOpen = false;
  }

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, this.SIDEBAR_TRANSITION_MS);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 1024 && this.isSidebarMobileOpen) {
      this.isSidebarMobileOpen = false;
    }
  }
}
