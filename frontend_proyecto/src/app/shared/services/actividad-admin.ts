import { Injectable, Injector, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth';

export type ModuloAdmin =
  | 'Usuarios'
  | 'Finanzas'
  | 'Inversiones'
  | 'Metas'
  | 'Educación'
  | 'Alianzas'
  | 'PQR'
  | 'Roles'
  | 'Reportes'
  | 'Seguridad'
  | 'Configuración';

export type ResultadoAuditoria = 'Exitoso' | 'Fallido' | 'Denegado';

export interface EventoAdmin {
  id: number;
  fecha: string;
  modulo: ModuloAdmin;
  titulo: string;
  detalle?: string;
  admin: string;
  afectado?: string;
  ip: string;
  resultado: ResultadoAuditoria;
}

interface OpcionesEvento {
  afectado?: string;
  resultado?: ResultadoAuditoria;
}

// TODO: la IP real la entrega el backend; en el navegador no se puede conocer.
export const IP_LOCAL = '192.168.1.10';

const HORA_MS = 3_600_000;
const hace = (horas: number): string => new Date(Date.now() - horas * HORA_MS).toISOString();

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK). Historial de ejemplo para que la auditoría no arranque vacía.
const HISTORIAL_MOCK: Omit<EventoAdmin, 'id'>[] = [
  { fecha: hace(2), modulo: 'Usuarios', titulo: 'Cambió el rol de un usuario', detalle: 'Rol cambiado de Usuario a Administrador.', admin: 'Administrador', afectado: 'camila@gmail.com', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(5), modulo: 'Usuarios', titulo: 'Bloqueó una cuenta', detalle: 'Actividad sospechosa en la cuenta.', admin: 'Administrador', afectado: 'carlos@gmail.com', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(9), modulo: 'Alianzas', titulo: 'Creó una nueva alianza', detalle: 'Banco Andino', admin: 'Camila Rojas', ip: '190.85.44.120', resultado: 'Exitoso' },
  { fecha: hace(14), modulo: 'Roles', titulo: 'Modificó permisos', detalle: 'Rol Moderador: se agregó "Cerrar PQR".', admin: 'Administrador', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(20), modulo: 'Usuarios', titulo: 'Intentó bloquear una cuenta', detalle: 'No tenía permiso para esta acción.', admin: 'Test User', afectado: 'usuario@gmail.com', ip: '181.49.12.77', resultado: 'Denegado' },
  { fecha: hace(27), modulo: 'Educación', titulo: 'Publicó un curso', detalle: 'Presupuesto personal en 30 días', admin: 'Camila Rojas', ip: '190.85.44.120', resultado: 'Exitoso' },
  { fecha: hace(31), modulo: 'Seguridad', titulo: 'Inicio de sesión fallido', detalle: 'Contraseña incorrecta (2 intentos).', admin: 'Camila Rojas', ip: '200.21.98.4', resultado: 'Fallido' },
  { fecha: hace(50), modulo: 'PQR', titulo: 'Cerró una PQR', detalle: 'PQR 1783402 marcada como resuelta.', admin: 'Camila Rojas', ip: '190.85.44.120', resultado: 'Exitoso' },
  { fecha: hace(73), modulo: 'Finanzas', titulo: 'Registró un movimiento', detalle: 'Freelance diseño', admin: 'Administrador', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(96), modulo: 'Reportes', titulo: 'Exportó un reporte', detalle: 'Usuarios registrados (Excel).', admin: 'Administrador', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(120), modulo: 'Metas', titulo: 'Actualizó una meta', detalle: 'Vacaciones', admin: 'Camila Rojas', ip: '190.85.44.120', resultado: 'Exitoso' },
  { fecha: hace(150), modulo: 'Configuración', titulo: 'Activó la verificación en dos pasos', admin: 'Administrador', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(190), modulo: 'Inversiones', titulo: 'Eliminó una inversión', detalle: 'Fondo inmobiliario', admin: 'Administrador', ip: '192.168.1.10', resultado: 'Exitoso' },
  { fecha: hace(240), modulo: 'Usuarios', titulo: 'Restableció una contraseña', detalle: 'Se envió un enlace de restablecimiento.', admin: 'Camila Rojas', afectado: 'test@gmail.com', ip: '190.85.44.120', resultado: 'Exitoso' },
];

/** Registro en memoria de lo que hacen los administradores. Alimenta la auditoría y la línea de tiempo del dashboard. */
@Injectable({ providedIn: 'root' })
export class ActividadAdminService {
  private injector = inject(Injector);
  private siguienteId = 1;

  readonly eventos = signal<EventoAdmin[]>(HISTORIAL_MOCK.map((e) => ({ ...e, id: this.siguienteId++ })));

  // TODO: al conectar el backend, esto lo entrega la bitácora de auditoría del servidor.
  registrar(modulo: ModuloAdmin, titulo: string, detalle?: string, opciones: OpcionesEvento = {}): void {
    // Se resuelve al momento de registrar para evitar una dependencia circular con AuthService.
    const usuario = this.injector.get(AuthService).obtenerUsuario();
    const admin = usuario ? `${usuario.nombre} ${usuario.apellido ?? ''}`.trim() : 'Administrador';

    this.eventos.update((lista) => [
      {
        id: this.siguienteId++,
        fecha: new Date().toISOString(),
        modulo,
        titulo,
        detalle,
        admin,
        afectado: opciones.afectado,
        ip: IP_LOCAL,
        resultado: opciones.resultado ?? 'Exitoso',
      },
      ...lista,
    ]);
  }
}
