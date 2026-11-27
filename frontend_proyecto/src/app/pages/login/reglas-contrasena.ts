/**
 * Reglas de la contraseña, las mismas que revisa el MID (validarContrasena en services/auth.go):
 * de 8 a 72 caracteres, al menos una mayúscula y al menos un número.
 */
export interface Regla {
  texto: string;
  cumple: boolean;
}

export const PATRON_CONTRASENA = /^(?=.*[A-Z])(?=.*\d).{8,72}$/;

export function reglasContrasena(clave: string): Regla[] {
  return [
    { texto: 'Entre 8 y 72 caracteres', cumple: clave.length >= 8 && clave.length <= 72 },
    { texto: 'Al menos una mayúscula', cumple: /[A-Z]/.test(clave) },
    { texto: 'Al menos un número', cumple: /\d/.test(clave) },
  ];
}
