import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Versión vigente de la política de tratamiento de datos. El registro la envía al MID
 * para dejar constancia de qué texto aceptó cada usuario: si cambia la política, se sube aquí.
 */
export const VERSION_POLITICA = '1.0';
export const VIGENCIA_POLITICA = '27 de noviembre de 2026';

/** Edad mínima para tener cuenta (la misma regla que valida el MID). */
export const EDAD_MINIMA = 18;

/** Fecha más reciente con la que alguien ya cumple la edad mínima hoy, en formato aaaa-mm-dd. */
export function fechaMaximaNacimiento(hoy = new Date()): string {
  const limite = new Date(hoy.getFullYear() - EDAD_MINIMA, hoy.getMonth(), hoy.getDate());
  return aTextoFecha(limite);
}

/** Validador del formulario: la fecha (aaaa-mm-dd) debe ser real y de alguien mayor de edad. */
export function mayorDeEdad(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  if (!valor) {
    return null; // de "obligatorio" se encarga Validators.required
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor < '1900-01-01') {
    return { fechaInvalida: true };
  }
  return valor > fechaMaximaNacimiento() ? { menorDeEdad: true } : null;
}

function aTextoFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
