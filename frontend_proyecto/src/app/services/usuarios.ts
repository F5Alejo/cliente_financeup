import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_URL, mensajeDeError } from './api';
import { AuthService } from './auth';
import type { EstadoUsuario, Rol, Usuario } from './auth';

export type UsuarioLista = Omit<Usuario, 'password'>;

export interface DatosNuevoUsuario {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: Rol;
  telefono?: string;
  documento?: string;
}

export interface DatosEdicionUsuario {
  nombre: string;
  apellido: string;
  telefono?: string;
  documento?: string;
}

export type AccionBitacora =
  | 'creacion'
  | 'edicion'
  | 'cambio-rol'
  | 'bloqueo'
  | 'desbloqueo'
  | 'restablecimiento';

export interface BitacoraUsuario {
  email: string;
  accion: AccionBitacora;
  motivo: string;
  fecha: string;
  admin: string;
}

export const MOTIVO_MIN_CARACTERES = 5;
export const NOMBRE_MIN_CARACTERES = 3;
export const PASSWORD_PATRON = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const ETIQUETA_ROL: Record<Rol, string> = { admin: 'Administrador', user: 'Usuario' };
export const ETIQUETA_ESTADO: Record<EstadoUsuario, string> = {
  activo: 'Activo',
  bloqueado: 'Bloqueado',
  pendiente: 'Pendiente',
  suspendido: 'Suspendido'
};
export const ETIQUETA_ACCION: Record<AccionBitacora, string> = {
  creacion: 'Cuenta creada por un administrador',
  edicion: 'Datos actualizados',
  'cambio-rol': 'Rol modificado',
  bloqueo: 'Cuenta bloqueada',
  desbloqueo: 'Cuenta desbloqueada',
  restablecimiento: 'Código de recuperación enviado'
};

// Estado en la base (auth.usuario) → estado de pantalla, y al revés al bloquear o reactivar
const ESTADOS: Record<string, EstadoUsuario> = { activo: 'activo', inactivo: 'bloqueado', suspendido: 'suspendido' };

// Así responde el MID GET /v1/admin/usuarios
interface UsuarioMid {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedula: string;
  estado: string;
  rol: Rol;
  fecha_registro: string;
  ultima_sesion: string | null;
}

function aUsuario(u: UsuarioMid): UsuarioLista {
  return {
    id: u.id_usuario,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono || undefined,
    documento: u.cedula || undefined,
    rol: u.rol,
    estado: ESTADOS[u.estado] ?? 'activo',
    fechaRegistro: u.fecha_registro,
    ultimoAcceso: u.ultima_sesion,
  };
}

/**
 * Usuarios del panel de administración (rutas /v1/admin/usuarios del MID).
 * La bitácora guarda lo que hizo el admin en esta sesión; el MID además
 * deja cada cambio en soporte.registro_actividad.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly usuarios = signal<UsuarioLista[]>([]);
  private registros: BitacoraUsuario[] = [];

  readonly cargando = signal(false);
  readonly error = signal('');
  /** Se incrementa con cada cambio para que otras vistas (dashboard, auditoría) se actualicen. */
  readonly cambios = signal(0);

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<UsuarioMid[]>(`${API_URL}/admin/usuarios`).subscribe({
      next: (lista) => {
        this.usuarios.set(lista.map(aUsuario));
        this.cargando.set(false);
        this.notificar();
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  listar(): UsuarioLista[] {
    return this.usuarios();
  }

  buscar(email: string): UsuarioLista | undefined {
    return this.usuarios().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  bitacora(): BitacoraUsuario[] {
    return [...this.registros];
  }

  /** Acciones administrativas registradas sobre una cuenta. */
  actividadDe(email: string): BitacoraUsuario[] {
    return this.registros.filter((r) => r.email.toLowerCase() === email.toLowerCase());
  }

  crear(datos: DatosNuevoUsuario): Observable<unknown> {
    const cuerpo = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim(),
      contrasena: datos.password,
      rol: datos.rol,
      telefono: datos.telefono?.trim() ?? '',
      cedula: datos.documento?.trim() ?? '',
    };
    return this.http
      .post(`${API_URL}/admin/usuarios`, cuerpo)
      .pipe(tap(() => this.despues(cuerpo.email, 'creacion', 'Cuenta creada desde el panel de administración.')));
  }

  editar(usuario: UsuarioLista, datos: DatosEdicionUsuario): Observable<unknown> {
    const cuerpo = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      telefono: datos.telefono?.trim() ?? '',
      cedula: datos.documento?.trim() ?? '',
    };
    return this.http
      .put(`${API_URL}/admin/usuarios/${usuario.id}`, cuerpo)
      .pipe(tap(() => this.despues(usuario.email, 'edicion', 'Se actualizaron los datos personales.')));
  }

  /** El MID cierra las sesiones del usuario: con el rol nuevo debe entrar otra vez. */
  cambiarRol(usuario: UsuarioLista, nuevoRol: Rol): Observable<unknown> {
    const motivo = `Rol cambiado de ${ETIQUETA_ROL[usuario.rol]} a ${ETIQUETA_ROL[nuevoRol]}.`;
    return this.http
      .put(`${API_URL}/admin/usuarios/${usuario.id}/rol`, { rol: nuevoRol })
      .pipe(tap(() => this.despues(usuario.email, 'cambio-rol', motivo)));
  }

  bloquear(usuario: UsuarioLista, motivo: string): Observable<unknown> {
    return this.cambiarEstado(usuario, 'inactivo', motivo.trim(), 'bloqueo');
  }

  /** Reactiva una cuenta bloqueada o suspendida. */
  desbloquear(usuario: UsuarioLista): Observable<unknown> {
    return this.cambiarEstado(usuario, 'activo', '', 'desbloqueo');
  }

  /** Le llega al usuario el mismo código de "¿Olvidaste tu contraseña?". */
  restablecerPassword(usuario: UsuarioLista): Observable<unknown> {
    return this.http
      .post(`${API_URL}/recuperar-contrasena`, { email: usuario.email })
      .pipe(tap(() => this.anotar(usuario.email, 'restablecimiento', 'Se envió el código para cambiar la contraseña.')));
  }

  private cambiarEstado(usuario: UsuarioLista, estado: string, motivo: string, accion: AccionBitacora): Observable<unknown> {
    return this.http
      .put(`${API_URL}/admin/usuarios/${usuario.id}/estado`, { estado, motivo })
      .pipe(tap(() => this.despues(usuario.email, accion, motivo || 'Reactivada por el administrador.')));
  }

  /** Tras un cambio que sí guardó el MID: se anota y se vuelve a pedir la lista. */
  private despues(email: string, accion: AccionBitacora, motivo: string): void {
    this.anotar(email, accion, motivo);
    this.cargar();
  }

  private anotar(email: string, accion: AccionBitacora, motivo: string): void {
    const admin = this.authService.obtenerUsuario()?.email ?? '';
    this.registros.push({ email, accion, motivo, fecha: new Date().toISOString(), admin });
    this.notificar();
  }

  private notificar(): void {
    this.cambios.update((n) => n + 1);
  }
}
