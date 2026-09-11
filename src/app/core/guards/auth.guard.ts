import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Not logged in as admin -> redirect to auth login
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url, role: 'admin' } });
  return false;
};

export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isShopOwner() || authService.isAdmin()) {
    return true;
  }

  // Not logged in as shop owner -> redirect to auth login
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url, role: 'shopowner' } });
  return false;
};
