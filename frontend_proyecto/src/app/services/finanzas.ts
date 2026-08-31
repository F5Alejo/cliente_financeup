import { Injectable } from '@angular/core';

export interface Movimiento {
  id: number;
  fecha: string; // formato YYYY-MM-DD
  concepto: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  valor: number;
  metodoPago?: string;
  observaciones?: string;
}

/** Ícono de cada categoría, para mostrarlo en el dashboard de Finanzas
 *  sin tener que guardar un ícono aparte en cada movimiento. */
const ICONOS_POR_CATEGORIA: Record<string, string> = {
  'Vivienda': '🏠',
  'Alimentación': '🍽️',
  'Transporte': '🚗',
  'Salud': '⚕️',
  'Entretenimiento': '🎮',
  'Servicios': '💡',
  'Educación': '🎓',
  'Gastos hormiga': '☕',
  'Salario': '💼',
  'Otros ingresos': '💻',
  'Ahorro': '🐷',
  'Otros': '📦',
};

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  // Fuente única de datos: la usan tanto el dashboard de Finanzas como el
  // Libro Mayor, así que agregar/editar/eliminar un movimiento en cualquiera
  // de los dos se refleja en el otro (antes cada uno tenía su propia lista
  // y no se comunicaban entre sí).
  private siguienteId = 100;

  movimientos: Movimiento[] = [
    { id: 1, fecha: '2026-03-01', concepto: 'Salario', categoria: 'Salario', tipo: 'ingreso', valor: 3000000 },
    { id: 2, fecha: '2026-03-02', concepto: 'Arriendo', categoria: 'Vivienda', tipo: 'gasto', valor: 1200000 },
    { id: 3, fecha: '2026-03-03', concepto: 'Mercado', categoria: 'Alimentación', tipo: 'gasto', valor: 450000 },
    { id: 4, fecha: '2026-03-05', concepto: 'Café diario', categoria: 'Gastos hormiga', tipo: 'gasto', valor: 60000 },
    { id: 5, fecha: '2026-03-10', concepto: 'Freelance diseño', categoria: 'Otros ingresos', tipo: 'ingreso', valor: 500000 },
  ];

  agregarMovimiento(datos: Omit<Movimiento, 'id'>): Movimiento {
    const nuevo: Movimiento = { id: this.siguienteId++, ...datos };
    this.movimientos.push(nuevo);
    return nuevo;
  }

  /** Agrega varios movimientos de una vez (la usa la importación de Excel del Libro Mayor). */
  agregarMovimientos(lista: Omit<Movimiento, 'id'>[]): Movimiento[] {
    const nuevos = lista.map((datos) => ({ id: this.siguienteId++, ...datos }));
    this.movimientos.push(...nuevos);
    return nuevos;
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

  /** Ícono a mostrar para una categoría (usado en las tarjetas de Finanzas). */
  iconoPorCategoria(categoria: string): string {
    return ICONOS_POR_CATEGORIA[categoria] ?? '💰';
  }
}
