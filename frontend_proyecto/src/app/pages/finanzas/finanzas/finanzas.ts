import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { FinanzasService, Movimiento } from '../../../services/finanzas';
import { MetasService } from '../../../services/metas';
import { InversionesService } from '../../../services/inversiones';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

/**
 * COMPONENTE: Finanzas (panel principal)
 * ------------------------------------------------------------------
 * Esta pantalla es única y exclusivamente un RESUMEN que redirige a cada
 * módulo real: no tiene su propio CRUD de movimientos ni de activos/pasivos
 * (eso vive en Libro Mayor y en Herramientas). Cada tarjeta, gráfica y panel
 * de aquí lee datos reales de los services compartidos y tiene un botón
 * que lleva al módulo donde esos datos se administran de verdad.
 * ------------------------------------------------------------------
 */

/** Un resultado de la barra de búsqueda: puede ser una sección, una meta, una inversión o un movimiento */
interface ResultadoBusqueda {
  icono: string;
  nombre: string;
  ruta: string;
  tipo: string;
}

interface TarjetaResumen {
  icono: string;
  titulo: string;
  valor: string;
  tendencia: string;
  /** A qué módulo redirige el botón de esta tarjeta (dónde vive el dato real). */
  ruta: string;
}

interface SegmentoGasto {
  etiqueta: string;
  porcentaje: number;
  color: string;
}

interface PuntoInversion {
  mes: string;
  valor: number;
}

interface Meta {
  nombre: string;
  icono: string;
  porcentaje: number;
  actual: number;
  objetivo: number;
}

@Component({
  selector: 'app-finanzas',
  imports: [FinanzasMenuComponent, FormsModule, MonedaPipe, CursoBannerComponent, RouterLink],
  templateUrl: './finanzas.html',
  styleUrls: ['./finanzas.css'],
})
export class FinanzasComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private finanzasService: FinanzasService,
    private metasService: MetasService,
    private inversionesService: InversionesService
  ) {}

  usuario: string = '';

  mesActual: string = new Date().toLocaleDateString('es-CO', {
  month: 'long',
  year: 'numeric'
});

  /** Radio y circunferencia usados por los anillos de metas (SVG) */
  radioAnillo = 30;
  circunferencia = 2 * Math.PI * this.radioAnillo;

  ngOnInit(): void {
    this.usuario = this.authService.obtenerNombre();
  }

  /** ----- Todos los movimientos reales (vienen del mismo service que usa Libro Mayor) ----- */
  private get todosLosMovimientos(): Movimiento[] {
    return this.finanzasService.movimientos;
  }

  /** Vista previa: solo los 5 más recientes. Para ver el resto, el botón de
   *  la tabla redirige a Libro Mayor (ahí es donde se administran de verdad). */
  get movimientos(): Movimiento[] {
    return this.todosLosMovimientos.slice(0, 5);
  }

  /** Ícono de un movimiento, según su categoría (delegado al service). */
  iconoDe(mov: Movimiento): string {
    return this.finanzasService.iconoPorCategoria(mov.categoria);
  }

  /** Convierte "2026-03-01" en algo legible, ej: "1 mar 2026". */
  formatearFecha(fecha: string): string {
    const fechaValida = new Date(`${fecha}T00:00:00`);
    if (isNaN(fechaValida.getTime())) return fecha;
    return fechaValida.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private get totalIngresos(): number {
    return this.todosLosMovimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.valor, 0);
  }

  private get totalGastos(): number {
    return this.todosLosMovimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.valor, 0);
  }

  /** ----- Tarjetas superiores, calculadas desde los movimientos reales -----
   *  Cada una redirige al módulo donde ese dato se administra: Ingreso,
   *  Gastos y Disponible vienen de los movimientos -> Libro Mayor; Ahorro
   *  se relaciona con las metas de ahorro -> Metas. */
  get tarjetas(): TarjetaResumen[] {
    const disponible = this.totalIngresos - this.totalGastos;
    const ahorroPct = this.totalIngresos > 0 ? Math.round((disponible / this.totalIngresos) * 100) : 0;
    return [
      { icono: '💰', titulo: 'Ingreso', valor: this.formatearCOP(this.totalIngresos), tendencia: 'Total registrado', ruta: '/libro-mayor' },
      { icono: '💼', titulo: 'Gastos', valor: this.formatearCOP(this.totalGastos), tendencia: 'Total registrado', ruta: '/libro-mayor' },
      { icono: '🏦', titulo: 'Disponible', valor: this.formatearCOP(disponible), tendencia: disponible >= 0 ? 'Te queda dinero' : 'Gastas más de lo que entra', ruta: '/libro-mayor' },
      { icono: '🐷', titulo: 'Ahorro', valor: `${ahorroPct}%`, tendencia: 'De tus ingresos', ruta: '/metas' },
    ];
  }

  /** ----- Indicador de salud financiera: En orden / Atención / Alto riesgo ----- */
  get salud(): { estado: string; mensaje: string } {
    const disponible = this.totalIngresos - this.totalGastos;
    const ahorroPct = this.totalIngresos > 0 ? (disponible / this.totalIngresos) * 100 : 0;

    if (disponible < 0) {
      return { estado: 'Alto riesgo', mensaje: 'Estás gastando más de lo que ganas.' };
    }
    if (ahorroPct < 10) {
      return { estado: 'Atención', mensaje: 'Tu margen de ahorro es bajo, revisa tus gastos.' };
    }
    return { estado: 'En orden', mensaje: 'Tus finanzas van bien, sigue así.' };
  }

  /** ============================================================
   *  Lupa como barra de navegación de toda la información
   *  del usuario (secciones + metas + inversiones + movimientos)
   * ============================================================ */
  mostrarBusqueda = signal(false);
  terminoBusqueda = signal('');

  /** Todas las secciones a las que el usuario puede navegar desde Finanzas */
  private secciones: ResultadoBusqueda[] = [
    { icono: '📊', nombre: 'Finanzas', ruta: '/finanzas', tipo: 'Sección' },
    { icono: '📒', nombre: 'Libro Mayor', ruta: '/libro-mayor', tipo: 'Sección' },
    { icono: '📈', nombre: 'Inversiones', ruta: '/inversiones', tipo: 'Sección' },
    { icono: '🎯', nombre: 'Metas', ruta: '/metas', tipo: 'Sección' },
    { icono: '💳', nombre: 'Resuelve tu deuda', ruta: '/resuelve-deuda', tipo: 'Sección' },
    { icono: '🧮', nombre: 'Herramientas', ruta: '/herramientas', tipo: 'Sección' },
  ];

  alternarBusqueda(): void {
    this.mostrarBusqueda.update((v) => !v);
    if (!this.mostrarBusqueda()) this.terminoBusqueda.set('');
  }

  /** Junta secciones + metas + inversiones + movimientos que coincidan con lo escrito.
   *  Los movimientos redirigen a Libro Mayor: es ahí donde realmente viven. */
  get resultadosBusqueda(): ResultadoBusqueda[] {
    const termino = this.terminoBusqueda().trim().toLowerCase();
    if (!termino) return [];

    const secciones = this.secciones.filter((s) => s.nombre.toLowerCase().includes(termino));

    const metas: ResultadoBusqueda[] = this.metasService.metas
      .filter((m) => m.nombre.toLowerCase().includes(termino))
      .map((m) => ({ icono: m.icono, nombre: m.nombre, ruta: '/metas', tipo: 'Meta' }));

    const inversiones: ResultadoBusqueda[] = this.inversionesService.inversiones
      .filter((i) => i.nombre.toLowerCase().includes(termino))
      .map((i) => ({ icono: '📈', nombre: i.nombre, ruta: '/inversiones', tipo: 'Inversión' }));

    const movimientos: ResultadoBusqueda[] = this.todosLosMovimientos
      .filter((m) => m.concepto.toLowerCase().includes(termino) || m.categoria.toLowerCase().includes(termino))
      .slice(0, 5)
      .map((m) => ({ icono: this.iconoDe(m), nombre: m.concepto, ruta: '/libro-mayor', tipo: 'Movimiento' }));

    return [...secciones, ...metas, ...inversiones, ...movimientos];
  }

  /** ============================================================
   *  La campana recomienda cursos según lo que más usa el
   *  usuario — si tiene más inversiones que movimientos/metas
   *  juntos, le sugerimos la escuela de Inversión; si no, Finanzas
   *  Personales (presupuesto, tarjetas, deuda).
   * ============================================================ */
  get escuelaRecomendada(): string {
    const actividadInversion = this.inversionesService.inversiones.length;
    const actividadPersonal = this.todosLosMovimientos.length + this.metasService.metas.length;
    return actividadInversion > actividadPersonal ? 'inversion' : 'finanzas-personales';
  }

  /** ----- Distribución de gastos por categoría (dona), calculada desde los movimientos ----- */
  private paletaDona = ['var(--sage)', 'var(--black)', 'var(--sand)', 'var(--cloud)', 'var(--sage-dark)', 'var(--sage-tint)'];

  get distribucion(): SegmentoGasto[] {
    const gastos = this.todosLosMovimientos.filter(m => m.tipo === 'gasto');
    const total = this.totalGastos;
    if (total === 0) return [];

    const porCategoria = new Map<string, number>();
    gastos.forEach(m => porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + m.valor));

    return Array.from(porCategoria.entries()).map(([etiqueta, monto], i) => ({
      etiqueta,
      porcentaje: Math.round((monto / total) * 100),
      color: this.paletaDona[i % this.paletaDona.length],
    }));
  }

  get gradienteDistribucion(): string {
    if (this.distribucion.length === 0) return 'var(--cloud)';
    let acumulado = 0;
    const partes = this.distribucion.map(seg => {
      const inicio = acumulado;
      acumulado += seg.porcentaje;
      return `${seg.color} ${inicio}% ${acumulado}%`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  /** ----- Crecimiento de inversión (línea) ----- */
  crecimiento: PuntoInversion[] = [
    { mes: 'Ene', valor: 14.5 }, { mes: 'Feb', valor: 14.8 }, { mes: 'Mar', valor: 14.9 },
    { mes: 'Abr', valor: 15.1 }, { mes: 'May', valor: 15.4 }, { mes: 'Jun', valor: 15.8 },
  ];

  get crecimientoInicio(): PuntoInversion {
    return this.crecimiento[0];
  }

  get crecimientoFin(): PuntoInversion {
    return this.crecimiento[this.crecimiento.length - 1];
  }

  get crecimientoPorcentaje(): number {
    const primero = this.crecimientoInicio.valor;
    const ultimo = this.crecimientoFin.valor;
    return Math.round(((ultimo - primero) / primero) * 1000) / 10;
  }

  get puntosLinea(): string {
    const datos = this.crecimiento;
    const max = Math.max(...datos.map(d => d.valor));
    const min = Math.min(...datos.map(d => d.valor));
    const ancho = 320;
    const alto = 90;
    return datos
      .map((d, i) => {
        const x = (i / (datos.length - 1)) * ancho;
        const y = alto - ((d.valor - min) / (max - min || 1)) * alto;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  /** Muestra el signo (+ / -) y el monto de un movimiento, según su tipo. */
  formatearMonto(mov: Movimiento): string {
    const signo = mov.tipo === 'gasto' ? '-' : '+';
    return `${signo}$${mov.valor.toLocaleString('es-CO')}`;
  }

  /** ----- Tus metas (anillos, vista previa de las primeras 4) ----- */
  get metas() {
    return this.metasService.metas.slice(0, 4);
  }

  obtenerOffset(porcentaje: number): number {
    return this.circunferencia * (1 - porcentaje / 100);
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }
}
