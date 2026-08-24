import { Injectable } from '@angular/core';

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
