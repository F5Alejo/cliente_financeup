import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { FinanzasService } from '../../../services/finanzas';
import { MetasService } from '../../../services/metas';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { ToastService } from '../../../shared/services/toast';

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
  imports: [FinanzasMenuComponent, FormsModule, MonedaPipe],
  templateUrl: './finanzas.html',
  styleUrls: ['./finanzas.css'],
})
export class FinanzasComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private finanzasService: FinanzasService,
    private metasService: MetasService,
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

  /** ----- Tarjetas superiores ----- */
  tarjetas: TarjetaResumen[] = [
    { icono: '💰', titulo: 'Ingreso', valor: '$3.0M', tendencia: '↑ +12.4% vs feb' },
    { icono: '💼', titulo: 'Presupuesto', valor: '$2.2M', tendencia: 'Sin cambios' },
    { icono: '🏦', titulo: 'Disponible', valor: '+$800k', tendencia: '↑ +8.7% vs feb' },
    { icono: '🐷', titulo: 'Ahorro', valor: '26%', tendencia: '↑ +2% vs feb' },
  ];

  /** ----- Distribución del salario (dona) ----- */
  distribucion: SegmentoGasto[] = [
    { etiqueta: 'Vivienda', porcentaje: 33, color: 'var(--green-primary)' },
    { etiqueta: 'Alimento', porcentaje: 25, color: 'var(--green-accent-text)' },
    { etiqueta: 'Transporte', porcentaje: 18, color: 'var(--green-soft)' },
    { etiqueta: 'Ahorro', porcentaje: 15, color: 'var(--bg-ahorro)' },
    { etiqueta: 'Ocio', porcentaje: 9, color: '#e2e8f0' },
  ];

  get gradienteDistribucion(): string {
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