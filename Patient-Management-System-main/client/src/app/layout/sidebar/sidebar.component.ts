import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { FDO_PERMISSIONS } from '../../core/constants/fdo-permissions';
import { NAV_ITEMS, NavItem } from '../navbar.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, AsyncPipe],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;

  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  @ViewChild('logoutConfirmModal')
  logoutConfirmModal?: ElementRef<HTMLDialogElement>;

  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  navItems: NavItem[] = [];
  currentUser$ = this.authService.currentUser$;
  isLoggingOut = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        //INFO: getting nav items for the role of user
        //INFO: This only guarantee that the user will see the nav items, but it does not guarantee that user can access the route, the route guard will handle that
        const items = NAV_ITEMS[user.role] || [];

        if (user.role === 'fdo') {
          const filteredItems = items.filter((item) => {
            if (item.requiredAnyPermissions?.length) {
              return this.authService.hasAnyPermission(
                item.requiredAnyPermissions,
              );
            }

            //INFO: It means that it is not fdo
            if (!item.requiredPermission) {
              return true;
            }

            return this.authService.hasPermission(item.requiredPermission);
          });

          this.navItems = this.resolveFdoNavRoutes(filteredItems);
          return;
        }

        this.navItems = items;
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDarkMode(): boolean {
    return this.themeService.currentTheme() === 'smart-hms-dark';
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  onCloseMobileSidebar(): void {
    this.closeMobile.emit();
  }

  onNavItemClick(): void {
    this.closeMobile.emit();
  }

  private resolveFdoNavRoutes(items: NavItem[]): NavItem[] {
    const canViewPatients = this.authService.hasPermission(
      FDO_PERMISSIONS.VIEW_PATIENTS,
    );
    const canCreatePatient = this.authService.hasPermission(
      FDO_PERMISSIONS.CREATE_PATIENT,
    );
    const canViewCases = this.authService.hasPermission(
      FDO_PERMISSIONS.VIEW_CASES,
    );
    const canCreateCase = this.authService.hasPermission(
      FDO_PERMISSIONS.CREATE_CASE,
    );
    const canViewAppointments = this.authService.hasPermission(
      FDO_PERMISSIONS.VIEW_APPOINTMENTS,
    );
    const canCreateAppointments = this.authService.hasPermission(
      FDO_PERMISSIONS.CREATE_APPOINTMENT,
    );

    return items.map((item) => {
      if (item.route === '/fdo/patients') {
        if (!canViewPatients && canCreatePatient) {
          return { ...item, route: '/fdo/patients/new' };
        }

        return item;
      }

      if (item.route === '/fdo/cases') {
        if (!canViewCases && canCreateCase) {
          return { ...item, route: '/fdo/cases/new' };
        }

        return item;
      }

      if (item.route !== '/fdo/appointments') {
        return item;
      }

      // Users with create-only access should land on the create page, not list page.
      if (!canViewAppointments && canCreateAppointments) {
        return { ...item, route: '/fdo/appointments/new' };
      }

      return item;
    });
  }

  openLogoutConfirm(): void {
    this.logoutConfirmModal?.nativeElement.showModal();
  }

  closeLogoutConfirm(): void {
    if (this.isLoggingOut) {
      return;
    }
    this.logoutConfirmModal?.nativeElement.close();
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.logoutConfirmModal?.nativeElement.close();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoggingOut = false;
        this.logoutConfirmModal?.nativeElement.close();
        this.router.navigate(['/login']);
      },
    });
  }
}
