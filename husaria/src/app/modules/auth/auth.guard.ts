import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

const requireLoggedUser = (url: string) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: url } });
      }

      if (user.mustChangePassword) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: url, changePassword: '1' } });
      }

      return true;
    })
  );
};

export const authGuard: CanActivateFn = (_route, state) => requireLoggedUser(state.url);

export const authChildGuard: CanActivateChildFn = (_route, state) => requireLoggedUser(state.url);

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      if (user.mustChangePassword) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, changePassword: '1' } });
      }

      return user.role === 'ADMIN' ? true : router.createUrlTree(['/league']);
    })
  );
};
