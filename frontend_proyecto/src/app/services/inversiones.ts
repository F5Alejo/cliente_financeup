import { Injectable } from '@angular/core';

/** Valor del portafolio al cierre de un mes. */
export interface PuntoPortafolio {
  /** Mes corto: 'jun'. */
  etiqueta: string;
  valor: number;
}

/**
 * Cuánto valía el portafolio cada uno de los últimos 12 meses frente a hoy
 * (datos de ejemplo hasta que el backend guarde el histórico).
 */
const FACTORES_12_MESES = [0.86, 0.872, 0.881, 0.893, 0.9, 0.91, 0.918, 0.937, 0.944, 0.958, 0.977, 1];

export interface Inversion {
  id: number;
  nombre: string;
  monto: number;
  rendimiento: number;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
  duracion: string;
}

@Injectable({
  providedIn: 'root'
})
export class InversionesService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  balanceInversiones = 15800000;
  balanceSemana = 250000;
  rendimientoTotal = 1350000;
  rendimientoPorcentaje = 25.8;
  proximoRetiro = '12 abril';
  progresoRetiro = 85;

  inversiones: Inversion[] = [
    { id: 1, nombre: 'Bonos del Gobierno', monto: 8000000, rendimiento: 600000, riesgo: 'Bajo', duracion: '2 años' },
    { id: 2, nombre: 'Fondo de Inversión', monto: 8600000, rendimiento: 800000, riesgo: 'Medio', duracion: '1 año' },
    { id: 3, nombre: 'Acciones Tecnológicas', monto: 7300000, rendimiento: 1300000, riesgo: 'Alto', duracion: '6 meses' },
    { id: 4, nombre: 'Criptomonedas', monto: 1000000, rendimiento: -440000, riesgo: 'Alto', duracion: 'Flexible' },
  ];

  /** Valor de hoy: lo invertido más lo que ha rendido. */
  get valorActual(): number {
    return this.inversiones.reduce((s, i) => s + i.monto + i.rendimiento, 0);
  }

  /** Valor del portafolio en los últimos `meses` meses (máximo 12), el último es el mes en curso. */
  historial(meses = 6, hoy = new Date()): PuntoPortafolio[] {
    const n = Math.min(Math.max(meses, 2), FACTORES_12_MESES.length);
    const base = this.valorActual;
    return FACTORES_12_MESES.slice(-n).map((factor, i) => {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1);
      return {
        etiqueta: fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
        valor: Math.round(base * factor),
      };
    });
  }

  agregarInversion(inversion: Inversion): void {
    this.inversiones.push(inversion);
  }

  editarInversion(id: number, cambios: Partial<Inversion>): void {
    const inversion = this.inversiones.find((i) => i.id === id);
    if (inversion) {
      Object.assign(inversion, cambios);
    }
  }

  eliminarInversion(id: number): void {
    this.inversiones = this.inversiones.filter((i) => i.id !== id);
  }
}
