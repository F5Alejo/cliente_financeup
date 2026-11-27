import { Injectable } from '@angular/core';
import { NombreIcono } from '../shared/components/icon/icon';

export interface Meta {
  id: number;
  nombre: string;
  icono: NombreIcono;
  porcentaje: number;
  actual: number;
  objetivo: number;
  cumplida: boolean;
  /** Fecha en la que se quiere lograr ('YYYY-MM-DD'), opcional. */
  fechaLimite?: string;
}

export interface NuevaMeta {
  nombre: string;
  icono: NombreIcono;
  actual: number;
  objetivo: number;
  fechaLimite?: string;
}

/** Último día del mes que está `n` meses adelante de hoy, en 'YYYY-MM-DD'. */
function mesesDesdeHoy(n: number): string {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + n + 1, 0);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

@Injectable({
  providedIn: 'root'
})
export class MetasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  // Fuente única de datos: la usan tanto las páginas de usuario (finanzas, metas)
  // como el panel de admin, para que siempre muestren la misma información.
  metas: Meta[] = [
    { id: 1, nombre: 'Vacaciones', icono: 'plane', porcentaje: 72, actual: 1800000, objetivo: 2500000, cumplida: false, fechaLimite: mesesDesdeHoy(5) },
    { id: 2, nombre: 'Emergencia', icono: 'life-buoy', porcentaje: 40, actual: 800000, objetivo: 2000000, cumplida: false, fechaLimite: mesesDesdeHoy(8) },
    { id: 3, nombre: 'Educación', icono: 'graduation-cap', porcentaje: 100, actual: 5000000, objetivo: 5000000, cumplida: true },
    { id: 4, nombre: 'Auto', icono: 'car', porcentaje: 25, actual: 1250000, objetivo: 5000000, cumplida: false },
    { id: 5, nombre: 'Casa propia', icono: 'home', porcentaje: 12, actual: 6000000, objetivo: 50000000, cumplida: false, fechaLimite: mesesDesdeHoy(60) },
    { id: 6, nombre: 'Viaje fin de año', icono: 'calendar', porcentaje: 55, actual: 1100000, objetivo: 2000000, cumplida: false, fechaLimite: mesesDesdeHoy(1) },
  ];

  private siguienteId = 7;

  agregarMeta(datos: NuevaMeta): void {
    const porcentaje = datos.objetivo > 0
      ? Math.min(100, Math.round((datos.actual / datos.objetivo) * 100))
      : 0;

    this.metas.push({
      id: this.siguienteId++,
      nombre: datos.nombre,
      icono: datos.icono,
      actual: datos.actual,
      objetivo: datos.objetivo,
      porcentaje,
      cumplida: datos.actual >= datos.objetivo,
      fechaLimite: datos.fechaLimite,
    });
  }

  editarMeta(id: number, cambios: Partial<Meta>): void {
    const meta = this.metas.find((m) => m.id === id);
    if (meta) {
      Object.assign(meta, cambios);
      if (cambios.actual !== undefined || cambios.objetivo !== undefined) {
        meta.porcentaje = meta.objetivo > 0
          ? Math.min(100, Math.round((meta.actual / meta.objetivo) * 100))
          : 0;
        meta.cumplida = meta.actual >= meta.objetivo;
      }
    }
  }

  eliminarMeta(id: number): void {
    this.metas = this.metas.filter((m) => m.id !== id);
  }
}
