import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { FinanzasService } from '../../../services/finanzas';
import { MetasService } from '../../../services/metas';
import { InversionesService } from '../../../services/inversiones';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { ToastService } from '../../../shared/services/toast';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

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

/** ----- Nuevo: Activos / Pasivos / Gastos ----- */
interface RegistroFinanciero {
  id: number;
  nombre: string;
  monto: number;
}

type TipoRegistro = 'activos' | 'pasivos' | 'gastos';

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
    private inversionesService: InversionesService,
    private toastService: ToastService
  ) {}

  mostrarTodosMovimientos = false;

  get movimientos() {
    const todos = this.finanzasService.movimientos;
    return this.mostrarTodosMovimientos ? todos : todos.slice(0, 5);
  }

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

  /** ----- Movimientos completos (sin recortar) y totales, para calcular todo lo de abajo ----- */
  private get todosLosMovimientos() {
    return this.finanzasService.movimientos;
  }

  private get totalIngresos(): number {
    return this.todosLosMovimientos.filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0);
  }

  private get totalGastos(): number {
    return this.todosLosMovimientos.filter(m => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0);
  }

  /** ----- Tarjetas superiores, calculadas desde los movimientos reales ----- */
  get tarjetas(): TarjetaResumen[] {
    const disponible = this.totalIngresos - this.totalGastos;
    const ahorroPct = this.totalIngresos > 0 ? Math.round((disponible / this.totalIngresos) * 100) : 0;
    return [
      { icono: '💰', titulo: 'Ingreso', valor: this.formatearCOP(this.totalIngresos), tendencia: 'Total registrado' },
      { icono: '💼', titulo: 'Gastos', valor: this.formatearCOP(this.totalGastos), tendencia: 'Total registrado' },
      { icono: '🏦', titulo: 'Disponible', valor: this.formatearCOP(disponible), tendencia: disponible >= 0 ? 'Te queda dinero' : 'Gastas más de lo que entra' },
      { icono: '🐷', titulo: 'Ahorro', valor: `${ahorroPct}%`, tendencia: 'De tus ingresos' },
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
   *  NUEVO: Lupa como barra de navegación de toda la información
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

  /** Junta secciones + metas + inversiones + movimientos que coincidan con lo escrito */
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
      .filter((m) => m.categoria.toLowerCase().includes(termino))
      .slice(0, 5)
      .map((m) => ({ icono: m.icono, nombre: m.categoria, ruta: '/finanzas', tipo: 'Movimiento' }));

    return [...secciones, ...metas, ...inversiones, ...movimientos];
  }

  /** ============================================================
   *  NUEVO: la campana recomienda cursos según lo que más usa el
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
  private paletaDona = ['var(--green-primary)', 'var(--green-accent-text)', 'var(--green-soft)', 'var(--bg-ahorro)', '#e2e8f0', '#94a3b8'];

  get distribucion(): SegmentoGasto[] {
    const gastos = this.todosLosMovimientos.filter(m => m.monto < 0);
    const total = this.totalGastos;
    if (total === 0) return [];

    const porCategoria = new Map<string, number>();
    gastos.forEach(m => porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + Math.abs(m.monto)));

    return Array.from(porCategoria.entries()).map(([etiqueta, monto], i) => ({
      etiqueta,
      porcentaje: Math.round((monto / total) * 100),
      color: this.paletaDona[i % this.paletaDona.length],
    }));
  }

  get gradienteDistribucion(): string {
    if (this.distribucion.length === 0) return '#e2e8f0';
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

  formatearMonto(valor: number): string {
    const signo = valor < 0 ? '-' : '+';
    return `${signo}$${Math.abs(valor).toLocaleString('es-CO')}`;
  }

  /** ----- Tus metas (anillos, vista previa de las primeras 4) ----- */
  get metas() {
    return this.metasService.metas.slice(0, 4);
  }

  obtenerOffset(porcentaje: number): number {
    return this.circunferencia * (1 - porcentaje / 100);
  }

  verTodos(): void {
    this.mostrarTodosMovimientos = !this.mostrarTodosMovimientos;
    this.toastService.info(
      this.mostrarTodosMovimientos
        ? 'Mostrando todos los movimientos'
        : 'Mostrando los movimientos más recientes'
    );
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  /** ============================================================
   *  NUEVO: Activos / Pasivos / Gastos (formulario funcional)
   * ============================================================ */

  /** Pestaña activa del bloque de registros */
  tipoActivo = signal<TipoRegistro>('activos');

  private siguienteId = 1000;

  registros: Record<TipoRegistro, RegistroFinanciero[]> = {
    activos: [
      { id: 1, nombre: 'Ahorros en cuenta', monto: 4000000 },
      { id: 2, nombre: 'Vehículo', monto: 12000000 },
    ],
    pasivos: [
      { id: 1, nombre: 'Tarjeta de crédito', monto: 900000 },
    ],
    gastos: [
      { id: 1, nombre: 'Arriendo', monto: 1200000 },
      { id: 2, nombre: 'Servicios', monto: 250000 },
    ],
  };

  /** Campos del formulario para agregar un registro nuevo */
  nombreNuevoRegistro: string = '';
  montoNuevoRegistro: number | null = null;

  cambiarTipoActivo(tipo: TipoRegistro): void {
    this.tipoActivo.set(tipo);
    this.nombreNuevoRegistro = '';
    this.montoNuevoRegistro = null;
  }

  get listaActiva(): RegistroFinanciero[] {
    return this.registros[this.tipoActivo()];
  }

agregarRegistro(): void {
    const nombre = this.nombreNuevoRegistro.trim();
    const monto = this.montoNuevoRegistro;

    if (!nombre || monto === null || monto <= 0) {
      this.toastService.info('Ingresa un nombre y un monto válido para agregar el registro.');
      return;
    }

    this.registros[this.tipoActivo()].push({
      id: this.siguienteId++,
      nombre,
      monto,
    });

    this.toastService.success('Registro agregado correctamente.');

    this.nombreNuevoRegistro = '';
    this.montoNuevoRegistro = null;
}

eliminarRegistro(id: number): void {
    const tipo = this.tipoActivo();
    const registro = this.registros[tipo].find((r) => r.id === id);
    const confirmado = confirm(`¿Eliminar "${registro?.nombre}"?`);
    if (!confirmado) return;

    this.registros[tipo] = this.registros[tipo].filter(r => r.id !== id);
    this.toastService.info('Registro eliminado.');
}

  totalPorTipo(tipo: TipoRegistro): number {
    return this.registros[tipo].reduce((suma, r) => suma + r.monto, 0);
  }

  get totalActivos(): number {
    return this.totalPorTipo('activos');
  }

  get totalPasivos(): number {
    return this.totalPorTipo('pasivos');
  }

  get totalGastosRegistrados(): number {
    return this.totalPorTipo('gastos');
  }

  get patrimonioNeto(): number {
    return this.totalActivos - this.totalPasivos;
  }
}