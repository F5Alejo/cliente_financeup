import { Injectable, signal } from '@angular/core';

export interface SesionAdmin {
  id: string;
  dispositivo: string;
  ip: string;
  ubicacion: string;
  ultimaActividad: string;
  actual: boolean;
}

export interface AccesoAdmin {
  fecha: string;
  dispositivo: string;
  ip: string;
  ubicacion: string;
  resultado: 'Exitoso' | 'Fallido';
}

const HORA_MS = 3_600_000;
const hace = (horas: number): string => new Date(Date.now() - horas * HORA_MS).toISOString();

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK). Reemplazar por GET /sesiones y DELETE /sesiones/:id del MID.
const SESIONES_MOCK: SesionAdmin[] = [
  { id: 'actual', dispositivo: 'Este navegador', ip: '192.168.1.10', ubicacion: 'Bogotá, CO', ultimaActividad: new Date().toISOString(), actual: true },
  { id: 's2', dispositivo: 'Chrome en Windows', ip: '190.85.44.120', ubicacion: 'Medellín, CO', ultimaActividad: hace(6), actual: false },
  { id: 's3', dispositivo: 'Safari en iPhone', ip: '181.49.12.77', ubicacion: 'Bogotá, CO', ultimaActividad: hace(30), actual: false },
];

const ACCESOS_MOCK: AccesoAdmin[] = [
  { fecha: hace(1), dispositivo: 'Este navegador', ip: '192.168.1.10', ubicacion: 'Bogotá, CO', resultado: 'Exitoso' },
  { fecha: hace(6), dispositivo: 'Chrome en Windows', ip: '190.85.44.120', ubicacion: 'Medellín, CO', resultado: 'Exitoso' },
  { fecha: hace(31), dispositivo: 'Chrome en Windows', ip: '200.21.98.4', ubicacion: 'Cali, CO', resultado: 'Fallido' },
  { fecha: hace(30), dispositivo: 'Safari en iPhone', ip: '181.49.12.77', ubicacion: 'Bogotá, CO', resultado: 'Exitoso' },
  { fecha: hace(72), dispositivo: 'Este navegador', ip: '192.168.1.10', ubicacion: 'Bogotá, CO', resultado: 'Exitoso' },
  { fecha: hace(120), dispositivo: 'Firefox en Linux', ip: '186.29.7.210', ubicacion: 'Barranquilla, CO', resultado: 'Fallido' },
];

@Injectable({ providedIn: 'root' })
export class SesionesAdminService {
  readonly sesiones = signal<SesionAdmin[]>(SESIONES_MOCK.map((s) => ({ ...s })));
  readonly accesos: AccesoAdmin[] = [...ACCESOS_MOCK].sort((a, b) => b.fecha.localeCompare(a.fecha));

  cerrar(id: string): void {
    this.sesiones.update((lista) => lista.filter((s) => s.id !== id || s.actual));
  }

  cerrarOtras(): number {
    const otras = this.sesiones().filter((s) => !s.actual).length;
    this.sesiones.update((lista) => lista.filter((s) => s.actual));
    return otras;
  }
}
