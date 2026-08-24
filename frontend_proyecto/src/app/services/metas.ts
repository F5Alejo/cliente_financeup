import { Injectable } from '@angular/core';

export interface Meta {
  nombre: string;
  icono: string;
  porcentaje: number;
  actual: number;
  objetivo: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  metas: Meta[] = [
    { nombre: 'Vacaciones', icono: '✈️', porcentaje: 72, actual: 1800000, objetivo: 2500000 },
    { nombre: 'Emergencia', icono: '🛟', porcentaje: 40, actual: 800000, objetivo: 2000000 },
    { nombre: 'Educación', icono: '🎓', porcentaje: 100, actual: 5000000, objetivo: 5000000 },
    { nombre: 'Auto', icono: '🚙', porcentaje: 25, actual: 1250000, objetivo: 5000000 },
    { nombre: 'Casa propia', icono: '🏠', porcentaje: 12, actual: 6000000, objetivo: 50000000 },
    { nombre: 'Viaje fin de año', icono: '🌴', porcentaje: 55, actual: 1100000, objetivo: 2000000 },
  ];

  agregarMeta(meta: Meta): void {
    this.metas.push(meta);
  }

  editarMeta(nombre: string, cambios: Partial<Meta>): void {
    const meta = this.metas.find((m) => m.nombre === nombre);
    if (meta) {
      Object.assign(meta, cambios);
    }
  }

  eliminarMeta(nombre: string): void {
    this.metas = this.metas.filter((m) => m.nombre !== nombre);
  }
}
