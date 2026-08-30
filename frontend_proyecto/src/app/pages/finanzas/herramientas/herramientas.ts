import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';

/**
 * COMPONENTE: Herramientas Financieras
 * ------------------------------------------------------------------
 * Página con 3 calculadoras educativas para que el usuario entienda y
 * proyecte distintos escenarios financieros:
 *   1) Interés simple
 *   2) Interés compuesto
 *   3) Fondo fiduciario (proyección estimada, no es asesoría real)
 *
 * Solo se muestra una calculadora a la vez; `herramientaActiva` guarda
 * cuál está seleccionada, y cada calculadora tiene sus propios campos
 * de entrada y sus propios "getters" que recalculan el resultado cada
 * vez que el usuario cambia un valor.
 * ------------------------------------------------------------------
 */

/** Identificador de cada calculadora disponible. */
type IdHerramienta = 'interes-simple' | 'interes-compuesto' | 'fondo-fiduciario';

/** Datos para dibujar la tarjeta de cada calculadora en el carrusel superior. */
interface Herramienta {
  id: IdHerramienta;
  icono: string;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-herramientas',
  imports: [FinanzasMenuComponent, FormsModule],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.css',
})
export class HerramientasComponent {
  /** Lista de calculadoras que se muestran como tarjetas seleccionables. */
  herramientas: Herramienta[] = [
    { id: 'interes-simple', icono: '➗', nombre: 'Interés Simple', descripcion: 'Calcula el interés sobre un capital fijo.' },
    { id: 'interes-compuesto', icono: '📈', nombre: 'Interés Compuesto', descripcion: 'Proyecta el crecimiento con capitalización.' },
    { id: 'fondo-fiduciario', icono: '🏛️', nombre: 'Fondo Fiduciario', descripcion: 'Simula un fideicomiso con aportes periódicos.' },
  ];

  /** Cuál calculadora está visible actualmente. */
  herramientaActiva = signal<IdHerramienta>('interes-simple');

  seleccionarHerramienta(id: IdHerramienta): void {
    this.herramientaActiva.set(id);
  }

  /** Da formato de pesos colombianos a un número, ej: 1200000 -> "$1.200.000". */
  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }

  /** ----- Interés Simple -----
   *  Fórmula: Interés = Capital × Tasa × Tiempo.
   *  A diferencia del compuesto, el interés siempre se calcula sobre el
   *  capital inicial, nunca se "reinvierte" sobre intereses ya ganados. */
  capitalSimple: number | null = 1000000;
  tasaSimple: number | null = 12; // % anual
  tiempoSimple: number | null = 12; // meses

  get interesSimpleCalculado(): number {
    if (!this.capitalSimple || !this.tasaSimple || !this.tiempoSimple) return 0;
    return this.capitalSimple * (this.tasaSimple / 100) * (this.tiempoSimple / 12);
  }

  get totalSimple(): number {
    return (this.capitalSimple ?? 0) + this.interesSimpleCalculado;
  }

  /** ----- Interés Compuesto -----
   *  Fórmula: Monto = Capital × (1 + tasa/n)^(n × años), donde "n" es
   *  cuántas veces al año se capitaliza (se suma el interés ganado al capital). */
  capitalCompuesto: number | null = 1000000;
  tasaCompuesto: number | null = 12; // % anual
  aniosCompuesto: number | null = 5;
  capitalizacionesPorAnio: number = 12; // mensual por defecto

  get montoCompuesto(): number {
    if (!this.capitalCompuesto || !this.tasaCompuesto || !this.aniosCompuesto) return 0;
    const n = this.capitalizacionesPorAnio;
    const r = this.tasaCompuesto / 100;
    return this.capitalCompuesto * Math.pow(1 + r / n, n * this.aniosCompuesto);
  }

  get gananciaCompuesta(): number {
    return this.montoCompuesto - (this.capitalCompuesto ?? 0);
  }

  /** ----- Fondo Fiduciario -----
   *  Proyección estimada que combina un capital inicial que crece con
   *  interés compuesto mensual, más aportes mensuales que también van
   *  generando su propio interés (fórmula de "valor futuro de una anualidad").
   *  Es solo orientativa: no es asesoría legal ni financiera. */
  capitalInicialFiduciario: number | null = 2000000;
  aporteMensualFiduciario: number | null = 300000;
  tasaFiduciaria: number | null = 8; // % anual estimado
  aniosFiduciario: number | null = 10;

  get proyeccionFiduciaria(): number {
    if (this.capitalInicialFiduciario === null || this.aporteMensualFiduciario === null || this.tasaFiduciaria === null || this.aniosFiduciario === null) {
      return 0;
    }
    const rMensual = this.tasaFiduciaria / 100 / 12;
    const meses = this.aniosFiduciario * 12;

    // Parte 1: cuánto crece el capital inicial solo, mes a mes.
    const capitalCrecido = this.capitalInicialFiduciario * Math.pow(1 + rMensual, meses);

    // Parte 2: cuánto crecen los aportes mensuales sumados (si la tasa es 0,
    // simplemente se suman los aportes sin generar interés).
    const aportesCrecidos = rMensual === 0
      ? this.aporteMensualFiduciario * meses
      : this.aporteMensualFiduciario * ((Math.pow(1 + rMensual, meses) - 1) / rMensual);

    return capitalCrecido + aportesCrecidos;
  }

  get totalAportadoFiduciario(): number {
    return (this.capitalInicialFiduciario ?? 0) + (this.aporteMensualFiduciario ?? 0) * ((this.aniosFiduciario ?? 0) * 12);
  }
}
