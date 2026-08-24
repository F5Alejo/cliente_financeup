import { Injectable } from '@angular/core';

export interface Meta {
  id: number;
  nombre: string;
  icono: string;
  porcentaje: number;
  actual: number;
  objetivo: number;
  cumplida: boolean;
}

export interface NuevaMeta {
  nombre: string;
  icono: string;
  actual: number;
  objetivo: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  // Fuente única de datos: la usan tanto las páginas de usuario (finanzas, metas)
  // como el panel de admin, para que siempre muestren la misma información.
  metas: Meta[] = [
    { id: 1, nombre: 'Vacaciones', icono: '✈️', porcentaje: 72, actual: 1800000, objetivo: 2500000, cumplida: false },
    { id: 2, nombre: 'Emergencia', icono: '🛟', porcentaje: 40, actual: 800000, objetivo: 2000000, cumplida: false },
    { id: 3, nombre: 'Educación', icono: '🎓', porcentaje: 100, actual: 5000000, objetivo: 5000000, cumplida: true },
    { id: 4, nombre: 'Auto', icono: '🚙', porcentaje: 25, actual: 1250000, objetivo: 5000000, cumplida: false },
    { id: 5, nombre: 'Casa propia', icono: '🏠', porcentaje: 12, actual: 6000000, objetivo: 50000000, cumplida: false },
    { id: 6, nombre: 'Viaje fin de año', icono: '🌴', porcentaje: 55, actual: 1100000, objetivo: 2000000, cumplida: false },
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
