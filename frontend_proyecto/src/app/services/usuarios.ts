import { Injectable, signal } from '@angular/core';
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
  | 'restablecimiento'
  | 'eliminacion';

export interface BitacoraUsuario {
  email: string;
  accion: AccionBitacora;
  motivo: string;
  fecha: string;
  admin: string;
}

export interface ResultadoAccion {
  exito: boolean;
  mensaje?: string;
}

type Validacion = { ok: true; objetivo: Usuario } | { ok: false; resultado: ResultadoAccion };

export const MOTIVO_MIN_CARACTERES = 5;
export const NOMBRE_MIN_CARACTERES = 3;
export const PASSWORD_PATRON = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_PATRON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIN_PERMISO: ResultadoAccion = { exito: false, mensaje: 'No tienes permiso para realizar esta acción.' };

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
  restablecimiento: 'Restablecimiento de contraseña',
  eliminacion: 'Cuenta eliminada'
};

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const hace = (dias: number, horas = 0): string => new Date(Date.now() - dias * DIA_MS - horas * HORA_MS).toISOString();

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK)
// Reemplazar por el MID real: GET /usuarios (une tabla usuario + rol), PUT /usuarios/:id/bloquear (con bitácora),
// PUT /usuarios/:id/rol. Las validaciones de permiso (403) deben vivir en el backend.
const USUARIOS_MOCK: Usuario[] = [
  { email: 'admin@gmail.com', password: '123456', nombre: 'Administrador', rol: 'admin', estado: 'activo', documento: '1020304050', fechaRegistro: hace(420), ultimoAcceso: hace(0, 1) },
  { email: 'camila@gmail.com', password: '123456', nombre: 'Camila', apellido: 'Rojas', rol: 'admin', estado: 'activo', documento: '1032456789', telefono: '3105550142', fechaRegistro: hace(380), ultimoAcceso: hace(2) },
  { email: 'usuario@gmail.com', password: '123456', nombre: 'Usuario Demo', rol: 'user', estado: 'activo', documento: '1098765432', telefono: '3001234567', fechaRegistro: hace(210), ultimoAcceso: hace(1) },
  { email: 'test@gmail.com', password: '123456', nombre: 'Test User', rol: 'user', estado: 'activo', fechaRegistro: hace(150), ultimoAcceso: hace(6) },
  { email: 'mateo@gmail.com', password: '123456', nombre: 'Mateo', apellido: 'Herrera', rol: 'user', estado: 'suspendido', documento: '1045678123', motivoBloqueo: 'Suspensión temporal por verificación de identidad.', fechaRegistro: hace(130), ultimoAcceso: hace(20) },
  { email: 'laura@gmail.com', password: '123456', nombre: 'Laura', apellido: 'Gómez', rol: 'user', estado: 'activo', documento: '1012345678', telefono: '3157778899', fechaRegistro: hace(95), ultimoAcceso: hace(2) },
  {
    email: 'carlos@gmail.com',
    password: '123456',
    nombre: 'Carlos',
    apellido: 'Ruiz',
    rol: 'user',
    estado: 'bloqueado',
    documento: '1076543210',
    motivoBloqueo: 'Actividad sospechosa en la cuenta.',
    fechaRegistro: hace(60),
    ultimoAcceso: hace(40)
  },
  { email: 'valentina@gmail.com', password: '123456', nombre: 'Valentina', apellido: 'Ortiz', rol: 'user', estado: 'activo', documento: '1023987654', fechaRegistro: hace(45), ultimoAcceso: hace(0, 3) },
  { email: 'andres@gmail.com', password: '123456', nombre: 'Andrés', apellido: 'Peña', rol: 'user', estado: 'activo', telefono: '3208889900', fechaRegistro: hace(28), ultimoAcceso: hace(12) },
  { email: 'daniela@gmail.com', password: '123456', nombre: 'Daniela', apellido: 'Vargas', rol: 'user', estado: 'activo', documento: '1089012345', fechaRegistro: hace(75), ultimoAcceso: hace(45) },
  { email: 'felipe@gmail.com', password: '123456', nombre: 'Felipe', apellido: 'Torres', rol: 'user', estado: 'activo', fechaRegistro: hace(8), ultimoAcceso: hace(6) },
  { email: 'julian@gmail.com', password: '123456', nombre: 'Julián', apellido: 'Castro', rol: 'user', estado: 'pendiente', fechaRegistro: hace(5), ultimoAcceso: null },
  { email: 'sofia@gmail.com', password: '123456', nombre: 'Sofía', apellido: 'Martínez', rol: 'user', estado: 'pendiente', telefono: '3126667788', fechaRegistro: hace(2), ultimoAcceso: null }
];

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private usuarios: Usuario[] = USUARIOS_MOCK.map((u) => ({ ...u }));
  private registros: BitacoraUsuario[] = [];

  /** Se incrementa con cada cambio para que otras vistas (por ejemplo, las notificaciones) se actualicen. */
  readonly cambios = signal(0);

  /** Lista para la tabla de administración: nunca incluye la contraseña. */
  listar(): UsuarioLista[] {
    return this.usuarios.map((u) => this.sinPassword(u));
  }

  obtener(email: string): UsuarioLista | undefined {
    const usuario = this.buscar(email);
    return usuario ? this.sinPassword(usuario) : undefined;
  }

  bitacora(): BitacoraUsuario[] {
    return [...this.registros];
  }

  /** Acciones administrativas registradas sobre una cuenta. */
  actividadDe(email: string): BitacoraUsuario[] {
    return this.registros.filter((r) => r.email.toLowerCase() === email.toLowerCase());
  }

  crear(datos: DatosNuevoUsuario, adminEmail: string): ResultadoAccion {
    if (!this.permiso(adminEmail)) {
      return SIN_PERMISO;
    }

    const email = datos.email.trim();
    if (!EMAIL_PATRON.test(email)) {
      return { exito: false, mensaje: 'El correo no tiene un formato válido.' };
    }
    if (datos.rol !== 'admin' && datos.rol !== 'user') {
      return { exito: false, mensaje: 'El rol seleccionado no es válido.' };
    }
    const errorNombre = this.validarNombre(datos.nombre, datos.apellido);
    if (errorNombre) {
      return errorNombre;
    }
    if (!PASSWORD_PATRON.test(datos.password)) {
      return {
        exito: false,
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número.'
      };
    }
    if (this.buscar(email)) {
      return { exito: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }

    this.agregar({
      email,
      password: datos.password,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      rol: datos.rol,
      ultimoAcceso: null,
      ...this.contacto(datos)
    });
    this.registrar(email, 'creacion', 'Cuenta creada desde el panel de administración.', adminEmail);
    return { exito: true };
  }

  editar(email: string, datos: DatosEdicionUsuario, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    const errorNombre = this.validarNombre(datos.nombre, datos.apellido);
    if (errorNombre) {
      return errorNombre;
    }

    const { objetivo } = validacion;
    objetivo.nombre = datos.nombre.trim();
    objetivo.apellido = datos.apellido.trim();
    Object.assign(objetivo, this.contacto(datos));
    this.registrar(objetivo.email, 'edicion', 'Se actualizaron los datos personales.', adminEmail);
    return { exito: true };
  }

  eliminar(email: string, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    const { objetivo } = validacion;
    this.usuarios = this.usuarios.filter((u) => u !== objetivo);
    this.registrar(objetivo.email, 'eliminacion', 'Eliminación de la cuenta.', adminEmail);
    return { exito: true };
  }

  cambiarRol(email: string, nuevoRol: Rol, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    const { objetivo } = validacion;
    if (objetivo.rol !== nuevoRol) {
      const anterior = objetivo.rol;
      objetivo.rol = nuevoRol;
      this.registrar(
        objetivo.email,
        'cambio-rol',
        `Rol cambiado de ${ETIQUETA_ROL[anterior]} a ${ETIQUETA_ROL[nuevoRol]}.`,
        adminEmail
      );
    }
    return { exito: true };
  }

  bloquear(email: string, motivo: string, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    const texto = motivo.trim();
    if (texto.length < MOTIVO_MIN_CARACTERES) {
      return {
        exito: false,
        mensaje: `Escribe el motivo del bloqueo (mínimo ${MOTIVO_MIN_CARACTERES} caracteres).`
      };
    }

    const { objetivo } = validacion;
    if (objetivo.estado === 'bloqueado') {
      return { exito: false, mensaje: 'La cuenta ya está bloqueada.' };
    }

    objetivo.estado = 'bloqueado';
    objetivo.motivoBloqueo = texto;
    this.registrar(objetivo.email, 'bloqueo', texto, adminEmail);
    return { exito: true };
  }

  /** Reactiva una cuenta bloqueada o suspendida. */
  desbloquear(email: string, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    const { objetivo } = validacion;
    if (objetivo.estado !== 'bloqueado' && objetivo.estado !== 'suspendido') {
      return { exito: false, mensaje: 'La cuenta no está bloqueada ni suspendida.' };
    }

    objetivo.estado = 'activo';
    delete objetivo.motivoBloqueo;
    this.registrar(objetivo.email, 'desbloqueo', 'Desbloqueo por administrador.', adminEmail);
    return { exito: true };
  }

  // TODO: el envío real del enlace de restablecimiento lo hace el backend (correo al usuario).
  restablecerPassword(email: string, adminEmail: string): ResultadoAccion {
    const validacion = this.validar(adminEmail, email);
    if (!validacion.ok) {
      return validacion.resultado;
    }

    this.registrar(validacion.objetivo.email, 'restablecimiento', 'Se envió un enlace para restablecer la contraseña.', adminEmail);
    return { exito: true };
  }

  // Métodos de uso interno de AuthService (login, registro y perfil).
  buscar(email: string): Usuario | undefined {
    return this.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  agregar(usuario: Usuario): void {
    this.usuarios.push({ estado: 'activo', fechaRegistro: new Date().toISOString(), ...usuario });
    this.notificar();
  }

  reemplazar(usuario: Usuario): void {
    const indice = this.usuarios.findIndex((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
    if (indice !== -1) {
      this.usuarios[indice] = usuario;
    }
  }

  private sinPassword(usuario: Usuario): UsuarioLista {
    const { password: _password, ...resto } = usuario;
    return { ...resto, estado: resto.estado ?? 'activo' };
  }

  private permiso(adminEmail: string): Usuario | null {
    const admin = this.buscar(adminEmail);
    return admin && admin.rol === 'admin' && (admin.estado ?? 'activo') === 'activo' ? admin : null;
  }

  private validarNombre(nombre: string, apellido: string): ResultadoAccion | null {
    if (nombre.trim().length < NOMBRE_MIN_CARACTERES || apellido.trim().length < NOMBRE_MIN_CARACTERES) {
      return {
        exito: false,
        mensaje: `El nombre y el apellido deben tener mínimo ${NOMBRE_MIN_CARACTERES} caracteres.`
      };
    }
    return null;
  }

  private contacto(datos: { telefono?: string; documento?: string }): Pick<Usuario, 'telefono' | 'documento'> {
    return {
      telefono: datos.telefono?.trim() || undefined,
      documento: datos.documento?.trim() || undefined
    };
  }

  private validar(adminEmail: string, objetivoEmail: string): Validacion {
    const admin = this.permiso(adminEmail);
    if (!admin) {
      return { ok: false, resultado: SIN_PERMISO };
    }

    const objetivo = this.buscar(objetivoEmail);
    if (!objetivo) {
      return { ok: false, resultado: { exito: false, mensaje: 'El usuario no existe.' } };
    }

    if (objetivo.email.toLowerCase() === admin.email.toLowerCase()) {
      return {
        ok: false,
        resultado: { exito: false, mensaje: 'No puedes modificar tu propia cuenta desde este panel.' }
      };
    }

    return { ok: true, objetivo };
  }

  private registrar(email: string, accion: AccionBitacora, motivo: string, admin: string): void {
    this.registros.push({ email, accion, motivo, fecha: new Date().toISOString(), admin });
    this.notificar();
  }

  private notificar(): void {
    this.cambios.update((n) => n + 1);
  }
}
