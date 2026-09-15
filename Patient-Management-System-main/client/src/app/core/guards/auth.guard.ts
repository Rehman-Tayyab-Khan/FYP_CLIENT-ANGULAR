import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FdoPermission } from '../constants/fdo-permissions';
 //INFO: Role based routing
const getRoleDashboardUrl = (
  authService: AuthService,
  router: Router,
): UrlTree => {
  if (!authService.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  if (authService.isAdmin()) return router.parseUrl('/admin/dashboard');
  if (authService.isDoctor()) return router.parseUrl('/doctor/dashboard');
  if (authService.isFdo())
    return router.parseUrl(authService.getFirstAllowedFdoRoute());

  return router.parseUrl('/login');
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }
 
  return getRoleDashboardUrl(authService, router);
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  return getRoleDashboardUrl(authService, router);
};

export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isDoctor()) {
    return true;
  }

  return getRoleDashboardUrl(authService, router);
};

export const fdoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isFdo()) {
    return true;
  }

  return getRoleDashboardUrl(authService, router);
};

const hasRoutePermission = (
  route: ActivatedRouteSnapshot,
  authService: AuthService,
): boolean => {
  if (!authService.isFdo()) {
    return true;
  }

  const requiredPermission = route.data?.['requiredPermission'] as
    | FdoPermission
    | undefined;

  const requiredAnyPermissions = route.data?.['requiredAnyPermissions'] as
    | FdoPermission[]
    | undefined;

  if (requiredAnyPermissions?.length) {
    return authService.hasAnyPermission(requiredAnyPermissions);
  }

  if (!requiredPermission) {
    return true;
  }

  return authService.hasPermission(requiredPermission);
};

const hasActiveRoutePermissions = (
  root: ActivatedRouteSnapshot,
  authService: AuthService,
): boolean => {
  let current: ActivatedRouteSnapshot | null = root;

  while (current) {
    if (!hasRoutePermission(current, authService)) {
      return false;
    }

    current = current.firstChild;
  }

  return true;
};

export const adminChildGuard: CanActivateChildFn = (route, state) =>
  adminGuard(route, state);
export const doctorChildGuard: CanActivateChildFn = (route, state) =>
  doctorGuard(route, state);




export const fdoChildGuard: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const roleCheck = fdoGuard(route, state);

  if (roleCheck !== true) {
    return roleCheck;
  }

  if (!hasActiveRoutePermissions(state.root, authService)) {
    return router.parseUrl(authService.getFirstAllowedFdoRoute());
  }

  return true;
};
