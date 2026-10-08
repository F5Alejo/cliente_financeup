import { Injectable, computed, inject, signal } from '@angular/core';
import { CategoriaNotificacion, PreferenciasAdminService } from './preferencias-admin';

export type NivelNotificacion = 'critico' | 'warning' | 'info';

export interface NotificacionAdmin {
  id: number;
  categoria: CategoriaNotificacion;
  titulo: string;
  detalle: string;
  fecha: string;
  leida: boolean;
  ruta: string;
  nivel: NivelNotificacion;
}

export const ETIQUETA_CATEGORIA: Record<CategoriaNotificacion, string> = {
  seguridad: 'Seguridad',
  usuarios: 'Nuevos usuarios',
  pqr: 'PQR',
  alianzas: 'Solicitudes de alianza',
  actividad: 'Actividad importante',
};

const HORA_MS = 3_600_000;
const hace = (horas: number): string => new Date(Date.now() - horas * HORA_MS).toISOString();

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK). Reemplazar por GET /notificaciones del MID.
const NOTIFICACIONES_MOCK: Omit<NotificacionAdmin, 'id'>[] = [
  { categoria: 'seguridad', titulo: 'Varios intentos de acceso fallidos', detalle: 'Cuenta carlos@gmail.com: 5 intentos en 10 minutos.', fecha: hace(3), leida: false, ruta: '/admin/usuarios', nivel: 'critico' },
  { categoria: 'usuarios', titulo: 'Nuevo usuario registrado', detalle: 'Sofía Martínez (sofia@gmail.com) espera activar su cuenta.', fecha: hace(20), leida: false, ruta: '/admin/usuarios', nivel: 'info' },
  { categoria: 'pqr', titulo: 'PQR con prioridad alta sin responder', detalle: 'Queja asesor · N.º 1121313131.', fecha: hace(28), leida: false, ruta: '/admin/pqr', nivel: 'warning' },
  { categoria: 'alianzas', titulo: 'Oferta próxima a vencer', detalle: 'Banco Andino: vence en 7 días.', fecha: hace(52), leida: false, ruta: '/admin/alianzas', nivel: 'warning' },
  { categoria: 'seguridad', titulo: 'Inicio de sesión desde un dispositivo nuevo', detalle: 'Cuenta de Camila Rojas · Bogotá, CO.', fecha: hace(75), leida: true, ruta: '/admin/configuracion', nivel: 'info' },
  { categoria: 'usuarios', titulo: 'Nuevo usuario registrado', detalle: 'Julián Castro (julian@gmail.com).', fecha: hace(120), leida: true, ruta: '/admin/usuarios', nivel: 'info' },
  { categoria: 'actividad', titulo: 'Se modificaron permisos de un rol', detalle: 'Rol Moderador actualizado por Administrador.', fecha: hace(150), leida: true, ruta: '/admin/roles', nivel: 'info' },
];

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private preferencias = inject(PreferenciasAdminService);
  private siguienteId = 1;

  readonly notificaciones = signal<NotificacionAdmin[]>(
    NOTIFICACIONES_MOCK.map((n) => ({ ...n, id: this.siguienteId++ }))
  );
  readonly sinLeer = computed(() => this.notificaciones().filter((n) => !n.leida).length);
  readonly recientes = computed(() => this.notificaciones().slice(0, 5));

  /** Crea una notificación nueva; se ignora si el administrador desactivó esa categoría. */
  agregar(datos: Omit<NotificacionAdmin, 'id' | 'fecha' | 'leida'>): void {
    if (!this.preferencias.prefs().notificaciones[datos.categoria]) {
      return;
    }
    this.notificaciones.update((lista) => [
      { ...datos, id: this.siguienteId++, fecha: new Date().toISOString(), leida: false },
      ...lista,
    ]);
  }

  marcarLeida(id: number): void {
    this.notificaciones.update((lista) => lista.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  marcarTodasLeidas(): void {
    this.notificaciones.update((lista) => lista.map((n) => ({ ...n, leida: true })));
  }
}
