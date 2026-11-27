import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Dirección base del MID. Todos los services arman sus rutas con esto. */
export const API_URL = environment.apiUrl;

/**
 * Convierte un error de HttpClient en un texto para mostrar al usuario.
 * El MID responde los errores como {"error": "mensaje"}.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Revisa que el MID esté encendido.';
    }
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
