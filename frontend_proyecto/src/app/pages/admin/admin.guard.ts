import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

export const adminGuard: CanActivateChildFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuario = authService.obtenerUsuario();

  if (usuario?.rol === 'admin') {
    return true;
  }

  router.navigateByUrl(usuario ? '/home' : '/login');
  return false;
};
