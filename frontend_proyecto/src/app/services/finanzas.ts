import { Injectable } from '@angular/core';

export interface Movimiento {
  id: number;
  icono: string;
  categoria: string;
  fecha: string;
  monto: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  movimientos: Movimiento[] = [
    { id: 1, icono: '🏠', categoria: 'Vivienda', fecha: '2 mar 2026', monto: 150000 },
    { id: 2, icono: '🍽️', categoria: 'Alimentación', fecha: '5 mar 2026', monto: -150000 },
    { id: 3, icono: '🚗', categoria: 'Transporte', fecha: '8 mar 2026', monto: 100000 },
  ];

  agregarMovimiento(movimiento: Movimiento): void {
    this.movimientos.push(movimiento);
  }

  editarMovimiento(id: number, cambios: Partial<Movimiento>): void {
    const movimiento = this.movimientos.find((m) => m.id === id);
    if (movimiento) {
      Object.assign(movimiento, cambios);
    }
  }

  eliminarMovimiento(id: number): void {
    this.movimientos = this.movimientos.filter((m) => m.id !== id);
  }
}
