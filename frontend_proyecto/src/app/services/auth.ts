import { Injectable } from '@angular/core';

export interface Usuario {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: string;
  telefono?: string;
  documento?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK)
// Reemplazar por llamadas HTTP al backend real cuando esté listo (HttpClient + endpoints de auth).
const USUARIOS_MOCK: Usuario[] = [
  { email: 'admin@gmail.com', password: '123456', nombre: 'Administrador', rol: 'admin' },
  { email: 'usuario@gmail.com', password: '123456', nombre: 'Usuario Demo', rol: 'user' },
  { email: 'test@gmail.com', password: '123456', nombre: 'Test User', rol: 'user' }
];

const STORAGE_KEY = 'financeup_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual: Usuario | null = null;

  // Lista en memoria: incluye los mock originales + los que se registren en esta sesión.
  // TODO: al conectar el backend real, este arreglo desaparece; registrarUsuario() pasa a ser un POST /api/auth/register.
  private usuarios: Usuario[] = [...USUARIOS_MOCK];

  constructor() {
    // Recupera la sesión si ya había un usuario logueado (persistencia entre recargas)
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    if (guardado) {
      this.usuarioActual = JSON.parse(guardado);
    }
  }

  /**
   * Valida credenciales contra los usuarios quemados (mock), sin crear sesión.
   * Se usa como primer paso del login, antes de pedir el código de verificación (2FA).
   */
  validarCredenciales(email: string, password: string): Usuario | null {
    const usuario = this.usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return usuario ?? null;
  }

  /**
   * Persiste la sesión de un usuario ya validado (segundo paso del login, tras el 2FA).
   */
  completarSesion(usuario: Usuario): void {
    this.usuarioActual = usuario;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  /**
   * Valida credenciales y crea la sesión en un solo paso (sin 2FA).
   * Devuelve true si el login fue exitoso, false si las credenciales son incorrectas.
   */
  iniciarSesion(email: string, password: string): boolean {
    const usuario = this.validarCredenciales(email, password);
    if (!usuario) {
      return false;
    }
    this.completarSesion(usuario);
    return true;
  }

  /**
   * Registra un nuevo usuario (mock, en memoria) y lo deja autenticado.
   * Devuelve { exito: true } si se creó, o { exito: false, mensaje } si el correo ya existe.
   */
  registrarUsuario(nombre: string, apellido: string, email: string, password: string): { exito: boolean; mensaje?: string } {
    const yaExiste = this.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (yaExiste) {
      return { exito: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }

    const nuevoUsuario: Usuario = {
      email,
      password,
      nombre,
      apellido,
      rol: 'user'
    };

    this.usuarios.push(nuevoUsuario);
    this.completarSesion(nuevoUsuario);

    return { exito: true };
  }

  /**
   * Actualiza los datos personales del usuario autenticado (mock, en memoria).
   */
  actualizarPerfil(datos: Partial<Usuario>): { exito: boolean } {
    if (!this.usuarioActual) {
      return { exito: false };
    }

    const actualizado: Usuario = { ...this.usuarioActual, ...datos, email: this.usuarioActual.email };
    this.usuarioActual = actualizado;

    const indice = this.usuarios.findIndex((u) => u.email.toLowerCase() === actualizado.email.toLowerCase());
    if (indice !== -1) {
      this.usuarios[indice] = actualizado;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    return { exito: true };
  }

  /**
   * Cambia la contraseña del usuario autenticado, validando la contraseña actual.
   */
  cambiarPassword(actual: string, nueva: string): { exito: boolean; mensaje?: string } {
    if (!this.usuarioActual) {
      return { exito: false, mensaje: 'No hay una sesión activa.' };
    }

    if (this.usuarioActual.password !== actual) {
      return { exito: false, mensaje: 'La contraseña actual no es correcta.' };
    }

    return this.actualizarPerfil({ password: nueva }).exito
      ? { exito: true }
      : { exito: false, mensaje: 'No se pudo actualizar la contraseña.' };
  }

  /**
   * Devuelve el usuario autenticado actualmente, o null si no hay sesión activa.
   */
  obtenerUsuario(): Usuario | null {
    return this.usuarioActual;
  }

  /**
   * Devuelve el nombre del usuario autenticado.
   */
  obtenerNombre(): string {
    return this.usuarioActual?.nombre || 'Invitado';
  }

  /**
   * Indica si hay una sesión activa.
   */
  estaAutenticado(): boolean {
    return this.usuarioActual !== null;
  }

  /**
   * Cierra la sesión actual.
   */
  cerrarSesion(): void {
    this.usuarioActual = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
