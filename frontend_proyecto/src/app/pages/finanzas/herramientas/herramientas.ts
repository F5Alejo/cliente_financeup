import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';
import { ToastService } from '../../../shared/services/toast';

/**
 * COMPONENTE: Herramientas Financieras
 * ------------------------------------------------------------------
 * Página con 4 calculadoras educativas para que el usuario entienda y
 * proyecte distintos escenarios financieros:
 *   1) Interés simple
 *   2) Interés compuesto
 *   3) Fondo fiduciario (proyección estimada, no es asesoría real)
 *   4) Patrimonio: Activos y Pasivos (antes vivía en Finanzas; se movió
 *      aquí para que Finanzas quede solo como un resumen que redirige a
 *      cada módulo, sin duplicar funcionalidad de administración).
 *
 * Solo se muestra una calculadora a la vez; `herramientaActiva` guarda
 * cuál está seleccionada, y cada calculadora tiene sus propios campos
 * de entrada y sus propios "getters" que recalculan el resultado cada
 * vez que el usuario cambia un valor.
 * ------------------------------------------------------------------
 */

/** Identificador de cada calculadora disponible. */
type IdHerramienta = 'interes-simple' | 'interes-compuesto' | 'fondo-fiduciario' | 'patrimonio';

/** Datos para dibujar la tarjeta de cada calculadora en el carrusel superior. */
interface Herramienta {
  id: IdHerramienta;
  icono: string;
  nombre: string;
  descripcion: string;
}

/** ----- Tipos para la calculadora de Patrimonio (Activos y Pasivos) ----- */
type TipoPatrimonio = 'activos' | 'pasivos';

interface RegistroPatrimonio {
  id: number;
  nombre: string;
  monto: number;
}

@Component({
  selector: 'app-herramientas',
  imports: [FinanzasMenuComponent, FormsModule, CursoBannerComponent],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.css',
})
export class HerramientasComponent {
  constructor(private toastService: ToastService) {}

  /** Lista de calculadoras que se muestran como tarjetas seleccionables. */
  herramientas: Herramienta[] = [
    { id: 'interes-simple', icono: '➗', nombre: 'Interés Simple', descripcion: 'Calcula el interés sobre un capital fijo.' },
    { id: 'interes-compuesto', icono: '📈', nombre: 'Interés Compuesto', descripcion: 'Proyecta el crecimiento con capitalización.' },
    { id: 'fondo-fiduciario', icono: '🏛️', nombre: 'Fondo Fiduciario', descripcion: 'Simula un fideicomiso con aportes periódicos.' },
    { id: 'patrimonio', icono: '🏦', nombre: 'Patrimonio', descripcion: 'Registra tus activos y pasivos para ver tu patrimonio neto.' },
  ];

  /** Definición corta y directa de cada concepto, para quien no lo conoce todavía. */
  definiciones: Record<IdHerramienta, string> = {
    'interes-simple': 'Es la ganancia que se calcula solo sobre el capital inicial: siempre es el mismo valor cada periodo, sin importar cuánto tiempo pase.',
    'interes-compuesto': 'Es la ganancia que se suma al capital y también empieza a generar su propio interés, por eso el dinero crece cada vez más rápido.',
    'fondo-fiduciario': 'Es un fideicomiso: le entregas tu dinero (capital + aportes) a un administrador para que lo invierta y busque hacerlo crecer con el tiempo.',
    'patrimonio': 'Tu patrimonio neto es lo que tienes (activos) menos lo que debes (pasivos): así sabes cuánto vale realmente tu bolsillo, no solo cuánto dinero ves en una cuenta.',
  };

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

  /** ----- Gráfica: interés simple vs. compuesto, con el mismo capital y tasa -----
   *  Sirve para VER por qué el compuesto termina ganando más: la línea
   *  simple crece en línea recta, la compuesta se va curvando hacia arriba. */
  get aniosGrafica(): number[] {
    const n = this.aniosCompuesto ?? 5;
    return Array.from({ length: n + 1 }, (_, i) => i);
  }

  get valoresSimpleGrafica(): number[] {
    const capital = this.capitalCompuesto ?? 0;
    const tasa = (this.tasaCompuesto ?? 0) / 100;
    return this.aniosGrafica.map((anio) => capital + capital * tasa * anio);
  }

  get valoresCompuestoGrafica(): number[] {
    const capital = this.capitalCompuesto ?? 0;
    const tasa = (this.tasaCompuesto ?? 0) / 100;
    return this.aniosGrafica.map((anio) => capital * Math.pow(1 + tasa, anio));
  }

  private aPuntosSvg(valores: number[]): string {
    const max = Math.max(...this.valoresSimpleGrafica, ...this.valoresCompuestoGrafica, 1);
    const ancho = 320;
    const alto = 90;
    return valores
      .map((v, i) => {
        const x = (i / (valores.length - 1 || 1)) * ancho;
        const y = alto - (v / max) * alto;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  get puntosLineaSimple(): string {
    return this.aPuntosSvg(this.valoresSimpleGrafica);
  }

  get puntosLineaCompuesta(): string {
    return this.aPuntosSvg(this.valoresCompuestoGrafica);
  }

  /** ============================================================
   *  Patrimonio: Activos y Pasivos (movido aquí desde Finanzas)
   * ============================================================ */

  /** Pestaña activa: Activos o Pasivos. */
  tipoPatrimonio = signal<TipoPatrimonio>('activos');

  private siguienteIdPatrimonio = 1000;

  registrosPatrimonio: Record<TipoPatrimonio, RegistroPatrimonio[]> = {
    activos: [
      { id: 1, nombre: 'Ahorros en cuenta', monto: 4000000 },
      { id: 2, nombre: 'Vehículo', monto: 12000000 },
    ],
    pasivos: [
      { id: 1, nombre: 'Tarjeta de crédito', monto: 900000 },
    ],
  };

  /** Campos del formulario para agregar un registro nuevo. */
  nombreNuevoRegistroPatrimonio: string = '';
  montoNuevoRegistroPatrimonio: number | null = null;

  cambiarTipoPatrimonio(tipo: TipoPatrimonio): void {
    this.tipoPatrimonio.set(tipo);
    this.nombreNuevoRegistroPatrimonio = '';
    this.montoNuevoRegistroPatrimonio = null;
  }

  get listaActivaPatrimonio(): RegistroPatrimonio[] {
    return this.registrosPatrimonio[this.tipoPatrimonio()];
  }

  agregarRegistroPatrimonio(): void {
    const nombre = this.nombreNuevoRegistroPatrimonio.trim();
    const monto = this.montoNuevoRegistroPatrimonio;

    if (!nombre || monto === null || monto <= 0) {
      this.toastService.info('Ingresa un nombre y un monto válido para agregar el registro.');
      return;
    }

    this.registrosPatrimonio[this.tipoPatrimonio()].push({
      id: this.siguienteIdPatrimonio++,
      nombre,
      monto,
    });

    this.toastService.success('Registro agregado correctamente.');

    this.nombreNuevoRegistroPatrimonio = '';
    this.montoNuevoRegistroPatrimonio = null;
  }

  eliminarRegistroPatrimonio(id: number): void {
    const tipo = this.tipoPatrimonio();
    const registro = this.registrosPatrimonio[tipo].find((r) => r.id === id);
    const confirmado = confirm(`¿Eliminar "${registro?.nombre}"?`);
    if (!confirmado) return;

    this.registrosPatrimonio[tipo] = this.registrosPatrimonio[tipo].filter(r => r.id !== id);
    this.toastService.info('Registro eliminado.');
  }

  totalPorTipoPatrimonio(tipo: TipoPatrimonio): number {
    return this.registrosPatrimonio[tipo].reduce((suma, r) => suma + r.monto, 0);
  }

  get totalActivosPatrimonio(): number {
    return this.totalPorTipoPatrimonio('activos');
  }

  get totalPasivosPatrimonio(): number {
    return this.totalPorTipoPatrimonio('pasivos');
  }

  get patrimonioNeto(): number {
    return this.totalActivosPatrimonio - this.totalPasivosPatrimonio;
  }
}
