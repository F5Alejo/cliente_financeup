import { NombreIcono } from '../shared/components/icon/icon';
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
const ICONOS_POR_CATEGORIA: Record<string, NombreIcono> = {
  'Vivienda': 'home',
  'Alimentación': 'utensils',
  'Transporte': 'car',
  'Salud': 'heart-pulse',
  'Entretenimiento': 'film',
  'Servicios': 'zap',
  'Educación': 'graduation-cap',
  'Gastos hormiga': 'coffee',
  'Salario': 'briefcase',
  'Otros ingresos': 'laptop',
  'Ahorro': 'piggy-bank',
  'Otros': 'package',
};

/** Variaciones fijas por mes (del más antiguo al actual): así los ejemplos no cambian entre recargas. */
const VARIACION = [
  { mercado: [238000, 214000], servicios: 186000, transporte: 162000, hormiga: 84000, ocio: 160000, extra: 0, salud: 0 },
  { mercado: [251000, 229000], servicios: 204000, transporte: 175000, hormiga: 92000, ocio: 210000, extra: 650000, salud: 0 },
  { mercado: [226000, 241000], servicios: 198000, transporte: 158000, hormiga: 71000, ocio: 120000, extra: 0, salud: 135000 },
  { mercado: [262000, 233000], servicios: 221000, transporte: 181000, hormiga: 66000, ocio: 95000, extra: 500000, salud: 0 },
  { mercado: [244000, 219000], servicios: 192000, transporte: 149000, hormiga: 58000, ocio: 140000, extra: 0, salud: 0 },
  { mercado: [236000, 228000], servicios: 188000, transporte: 154000, hormiga: 49000, ocio: 110000, extra: 720000, salud: 0 },
];

/** Genera los movimientos de ejemplo de los últimos seis meses, sin pasar del día de hoy. */
export function movimientosDeEjemplo(hoy: Date): Movimiento[] {
  const lista: Movimiento[] = [];
  let id = 1;
  for (let atras = 5; atras >= 0; atras--) {
    const mes = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
    const v = VARIACION[5 - atras];
    const salario = atras <= 1 ? 3200000 : 3000000;
    const filas: [number, string, string, Movimiento['tipo'], number][] = [
      [1, 'Salario', 'Salario', 'ingreso', salario],
      [2, 'Arriendo', 'Vivienda', 'gasto', 1200000],
      [3, 'Mercado de la quincena', 'Alimentación', 'gasto', v.mercado[0]],
      [5, 'Servicios públicos', 'Servicios', 'gasto', v.servicios],
      [8, 'Recarga de transporte', 'Transporte', 'gasto', v.transporte],
      [12, 'Cafés y antojos', 'Gastos hormiga', 'gasto', v.hormiga],
      [15, 'Freelance diseño', 'Otros ingresos', 'ingreso', v.extra],
      [17, 'Mercado de la quincena', 'Alimentación', 'gasto', v.mercado[1]],
      [20, 'Salidas y streaming', 'Entretenimiento', 'gasto', v.ocio],
      [22, 'Cita médica', 'Salud', 'gasto', v.salud],
      [25, 'Ahorro programado', 'Ahorro', 'gasto', 300000],
    ];
    for (const [dia, concepto, categoria, tipo, valor] of filas) {
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
      if (valor <= 0 || fecha > hoy) continue;
      lista.push({ id: id++, fecha: aIso(fecha), concepto, categoria, tipo, valor });
    }
  }
  return lista;
}

function aIso(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

/** Ingresos y gastos de un mes. */
export interface ResumenMes {
  /** 'YYYY-MM' */
  clave: string;
  /** Nombre corto del mes: «jun». */
  etiqueta: string;
  ingresos: number;
  gastos: number;
}

/** Total de gasto de una categoría. */
export interface GastoCategoria {
  etiqueta: string;
  valor: number;
}

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

  /** Seis meses de ejemplo hasta hoy, para que el panel y el Libro Mayor tengan historia que graficar. */
  movimientos: Movimiento[] = movimientosDeEjemplo(new Date());

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
  iconoPorCategoria(categoria: string): NombreIcono {
    return ICONOS_POR_CATEGORIA[categoria] ?? 'wallet';
  }

  /** Ingresos y gastos de los últimos `meses` meses, del más antiguo al actual (incluye meses en cero). */
  resumenMensual(meses = 6, hoy = new Date()): ResumenMes[] {
    const lista: ResumenMes[] = [];
    for (let atras = meses - 1; atras >= 0; atras--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
      const clave = aIso(fecha).slice(0, 7);
      const delMes = this.movimientos.filter((m) => m.fecha.startsWith(clave));
      lista.push({
        clave,
        etiqueta: fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
        ingresos: delMes.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.valor, 0),
        gastos: delMes.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.valor, 0),
      });
    }
    return lista;
  }

  /** Gasto por categoría de un mes ('YYYY-MM') o de todo el historial, de mayor a menor. */
  gastosPorCategoria(clave?: string): GastoCategoria[] {
    const mapa = new Map<string, number>();
    for (const m of this.movimientos) {
      if (m.tipo !== 'gasto' || (clave && !m.fecha.startsWith(clave))) continue;
      mapa.set(m.categoria, (mapa.get(m.categoria) ?? 0) + m.valor);
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
  }
}
