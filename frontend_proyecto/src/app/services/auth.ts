import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_URL } from './api';

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
  /** Id del usuario en la base (lo manda el MID). */
  id?: number;
  /** Token JWT que entrega el MID al iniciar sesión. */
  token?: string;
  email: string;
  password?: string;
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

/** Respuesta del paso 1 del login: el MID envía el código al correo. */
export interface PasoLogin {
  mensaje: string;
  token_verificacion: string;
}

/** Datos del formulario de registro. */
export interface DatosRegistro {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
}

/** Lo que responde el MID cuando la sesión queda iniciada. */
interface SesionMid {
  token: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
}

/** Perfil como lo devuelve el MID (GET /perfil/:id). */
export interface Perfil {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  tipo_documento: string;
  cedula: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  fecha_nacimiento: string;
  estado: EstadoUsuario;
  rol: Rol;
}

/** Datos personales que se pueden editar en "Mi perfil" (el correo y la cédula no). */
export interface DatosPerfil {
  nombre: string;
  apellido: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  fecha_nacimiento: string;
}

/** Respuesta simple del MID: solo un mensaje. */
export interface Mensaje {
  mensaje: string;
}

const STORAGE_KEY = 'financeup_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private usuarioActual: Usuario | null = null;

  constructor() {
    // Recupera la sesión si ya había un usuario logueado (persistencia entre recargas)
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    if (guardado) {
      this.usuarioActual = JSON.parse(guardado);
    }
  }

  /** Login, paso 1: el MID revisa correo y contraseña y envía un código al correo. */
  iniciarSesion(email: string, contrasena: string): Observable<PasoLogin> {
    return this.http.post<PasoLogin>(`${API_URL}/login`, { email, contrasena });
  }

  /** Login, paso 2: con el código correcto el MID entrega el token y se guarda la sesión. */
  verificarCodigo(tokenVerificacion: string, codigo: string): Observable<Usuario> {
    return this.http
      .post<SesionMid>(`${API_URL}/login/verificar`, { token_verificacion: tokenVerificacion, codigo })
      .pipe(map((sesion) => this.guardarSesion(sesion)));
  }

  /** Botón "Reenviar código" del paso 2. */
  reenviarCodigo(tokenVerificacion: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${API_URL}/login/reenviar`, { token_verificacion: tokenVerificacion });
  }

  /** Crea la cuenta en el MID; el MID responde con la sesión ya iniciada. */
  registrar(datos: DatosRegistro): Observable<Usuario> {
    return this.http
      .post<SesionMid>(`${API_URL}/registro`, { ...datos, acepta_terminos: true })
      .pipe(map((sesion) => this.guardarSesion(sesion)));
  }

  /** Pasa la respuesta del MID al formato del cliente y la guarda en sessionStorage. */
  private guardarSesion(sesion: SesionMid): Usuario {
    const usuario: Usuario = {
      id: sesion.id_usuario,
      token: sesion.token,
      email: sesion.email,
      nombre: sesion.nombre,
      apellido: sesion.apellido,
      rol: sesion.rol,
      estado: sesion.estado,
      ultimoAcceso: new Date().toISOString(),
    };
    this.usuarioActual = usuario;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    return usuario;
  }

  /** Trae el perfil del usuario que tiene la sesión. */
  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${API_URL}/perfil/${this.usuarioActual?.id}`);
  }

  /** Guarda los datos personales y deja el nombre nuevo en la sesión (lo usa el menú). */
  actualizarPerfil(datos: DatosPerfil): Observable<Perfil> {
    return this.http.put<Perfil>(`${API_URL}/perfil/${this.usuarioActual?.id}`, datos).pipe(
      map((perfil) => {
        if (this.usuarioActual) {
          this.usuarioActual = { ...this.usuarioActual, nombre: perfil.nombre, apellido: perfil.apellido };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.usuarioActual));
        }
        return perfil;
      })
    );
  }

  /** Cambia la contraseña desde el perfil (el MID revisa que la actual sea correcta). */
  cambiarContrasena(actual: string, nueva: string): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${API_URL}/perfil/${this.usuarioActual?.id}/contrasena`, {
      contrasena_actual: actual,
      contrasena_nueva: nueva,
    });
  }

  /** "Olvidé mi contraseña", paso 1: el MID envía un código al correo. */
  pedirCodigoRecuperacion(email: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${API_URL}/recuperar-contrasena`, { email });
  }

  /** "Olvidé mi contraseña", paso 2: con el código se guarda la contraseña nueva. */
  restablecerContrasena(email: string, codigo: string, nueva: string): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${API_URL}/recuperar-contrasena`, { email, codigo, contrasena_nueva: nueva });
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
   * Cierra la sesión: le avisa al MID (queda en la auditoría) y borra la sesión local.
   * Si el MID no responde, la sesión local se borra igual.
   */
  cerrarSesion(): void {
    if (this.usuarioActual?.token) {
      this.http.post(`${API_URL}/logout`, {}).subscribe({ error: () => {} });
    }
    this.borrarSesion();
  }

  /** Borra la sesión guardada en el navegador (sin llamar al MID). */
  borrarSesion(): void {
    this.usuarioActual = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
