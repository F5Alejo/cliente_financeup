import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

export const adminGuard: CanActivateChildFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.obtenerUsuario()?.rol === 'admin') {
    return true;
  }

  router.navigateByUrl('/finanzas');
  return false;
};
