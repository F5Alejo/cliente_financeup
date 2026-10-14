import { inject, Injectable } from '@angular/core';
import { NotificacionesService } from './notificaciones';
import { UsuariosService } from './usuarios';

export type Rol = 'admin' | 'user';
export type EstadoUsuario = 'activo' | 'bloqueado' | 'pendiente' | 'suspendido';

const MENSAJE_SIN_ACCESO: Record<Exclude<EstadoUsuario, 'activo'>, string> = {
  bloqueado: 'Tu cuenta está bloqueada. Comunícate con soporte para más información.',
  suspendido: 'Tu cuenta está suspendida temporalmente. Comunícate con soporte para más información.',
  pendiente: 'Tu cuenta está pendiente de activación. Revisa tu correo para confirmarla.'
};

/** Mensaje a mostrar si la cuenta no puede iniciar sesión; null si puede hacerlo. */
export function motivoSinAcceso(usuario: { estado?: EstadoUsuario }): string | null {
  const estado = usuario.estado ?? 'activo';
  return estado === 'activo' ? null : MENSAJE_SIN_ACCESO[estado];
}

export interface Usuario {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: Rol;
  estado?: EstadoUsuario;
  motivoBloqueo?: string;
  fechaRegistro?: string;
  ultimoAcceso?: string | null;
  telefono?: string;
  documento?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

const STORAGE_KEY = 'financeup_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual: Usuario | null = null;

  // La lista de usuarios (mock en memoria) vive en UsuariosService.
  // TODO: al conectar el backend real, registrarUsuario() pasa a ser un POST /api/auth/register.
  private usuariosService = inject(UsuariosService);
  private notificaciones = inject(NotificacionesService);

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
    const usuario = this.usuariosService.buscar(email);
    return usuario && usuario.password === password ? usuario : null;
  }

  /**
   * Persiste la sesión de un usuario ya validado (segundo paso del login, tras el 2FA).
   */
  completarSesion(usuario: Usuario): void {
    usuario.ultimoAcceso = new Date().toISOString();
    this.usuarioActual = usuario;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  /**
   * Valida credenciales y crea la sesión en un solo paso (sin 2FA).
   * Devuelve true si el login fue exitoso, false si las credenciales son incorrectas.
   */
  iniciarSesion(email: string, password: string): boolean {
    const usuario = this.validarCredenciales(email, password);
    if (!usuario || motivoSinAcceso(usuario)) {
      return false;
    }
    this.completarSesion(usuario);
    return true;
  }

  /**
   * Login con proveedor social (Google/Apple/Facebook).
   * MOCK: simula la respuesta del proveedor mientras no haya SDK/backend real conectado.
   * TODO: reemplazar por el flujo real de cada proveedor (ver notas de integración).
   */
  iniciarSesionConProveedor(proveedor: 'google' | 'apple' | 'facebook'): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const emailSimulado = `usuario@${proveedor}.com`;

        let usuario = this.usuariosService.buscar(emailSimulado);

        const sinAcceso = usuario ? motivoSinAcceso(usuario) : null;
        if (sinAcceso) {
          reject(new Error(sinAcceso));
          return;
        }

        // Si es la primera vez que "entra" con ese proveedor, se crea el usuario
        if (!usuario) {
          usuario = {
            email: emailSimulado,
            password: '', // no aplica en login social
            nombre: `Usuario ${proveedor.charAt(0).toUpperCase() + proveedor.slice(1)}`,
            rol: 'user'
          };
          this.usuariosService.agregar(usuario);
        }

        this.usuarioActual = usuario;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
        resolve(usuario);
      }, 1200);
    });
  }

  /**
   * Registra un nuevo usuario (mock, en memoria) y lo deja autenticado.
   * Devuelve { exito: true } si se creó, o { exito: false, mensaje } si el correo ya existe.
   */
  registrarUsuario(nombre: string, apellido: string, email: string, password: string): { exito: boolean; mensaje?: string } {
    if (this.usuariosService.buscar(email)) {
      return { exito: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }

    const nuevoUsuario: Usuario = {
      email,
      password,
      nombre,
      apellido,
      rol: 'user'
    };

    this.usuariosService.agregar(nuevoUsuario);
    this.notificaciones.agregar({
      categoria: 'usuarios',
      titulo: 'Nuevo usuario registrado',
      detalle: `${nombre} ${apellido} (${email}).`,
      ruta: '/admin/usuarios',
      nivel: 'info',
    });
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

    this.usuariosService.reemplazar(actualizado);

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
