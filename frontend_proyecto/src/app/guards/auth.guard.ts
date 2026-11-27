import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/** Pide sesión iniciada; el usuario que no ha aceptado la política vigente va primero a aceptarla. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuario = authService.obtenerUsuario();

  if (!usuario) {
    return router.parseUrl('/login');
  }
  return usuario.debeAceptarPolitica ? router.parseUrl('/aceptar-politica') : true;
};

/** La pantalla de aceptar la política solo tiene sentido si hay sesión y falta aceptarla. */
export const politicaPendienteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuario = authService.obtenerUsuario();

  if (!usuario) {
    return router.parseUrl('/login');
  }
  return usuario.debeAceptarPolitica ? true : router.parseUrl(authService.rutaDeInicio(usuario));
};
