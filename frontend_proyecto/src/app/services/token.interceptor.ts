import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';

/**
 * Le agrega el token de la sesión a cada petición que va al MID
 * (Authorization: Bearer <token>). Si el MID responde 401, el token
 * ya no sirve: se borra la sesión y se manda al usuario al login.
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.obtenerUsuario()?.token;

  const conToken = token ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : peticion;

  return siguiente(conToken).pipe(
    catchError((error) => {
      if (error.status === 401 && token) {
        auth.borrarSesion();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
