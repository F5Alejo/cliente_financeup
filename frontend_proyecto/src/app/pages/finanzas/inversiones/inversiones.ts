import { Component, signal } from '@angular/core';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { InversionesService, Inversion } from '../../../services/inversiones';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';

interface SegmentoCartera {
  etiqueta: string;
  porcentaje: number;
  color: string;
}

interface PuntoRendimiento {
  periodo: string;
  valor: number;
}

@Component({
  selector: 'app-inversiones',
  imports: [FinanzasMenuComponent, MonedaPipe],
  templateUrl: './inversiones.html',
  styleUrl: './inversiones.css',
})
export class InversionesComponent {
  constructor(
    private inversionesService: InversionesService,
    private toastService: ToastService
  ) {}

  /** ----- Tarjetas superiores ----- */
  get balanceInversiones() { return this.inversionesService.balanceInversiones; }
  get balanceSemana() { return this.inversionesService.balanceSemana; }
  get rendimientoTotal() { return this.inversionesService.rendimientoTotal; }
  get rendimientoPorcentaje() { return this.inversionesService.rendimientoPorcentaje; }
  get proximoRetiro() { return this.inversionesService.proximoRetiro; }
  get progresoRetiro() { return this.inversionesService.progresoRetiro; }

  radioAnillo = 30;
  circunferencia = 2 * Math.PI * this.radioAnillo;

  get offsetRetiro(): number {
    return this.circunferencia * (1 - this.progresoRetiro / 100);
  }

  /** ----- Crecimiento de rendimiento ----- */
  periodos = ['1M', '3M', '6M', '1A', 'Todos'];
  periodoActivo = signal('6M');

  crecimiento: PuntoRendimiento[] = [
    { periodo: 'Ene', valor: 14.5 }, { periodo: 'Feb', valor: 14.7 }, { periodo: 'Mar', valor: 14.6 },
    { periodo: 'Abr', valor: 14.9 }, { periodo: 'May', valor: 15.1 }, { periodo: 'Jun', valor: 15.3 },
  ];

  seleccionarPeriodo(p: string): void {
    this.periodoActivo.set(p);
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

  get crecimientoInicio(): PuntoRendimiento {
    return this.crecimiento[0];
  }

  get crecimientoFin(): PuntoRendimiento {
    return this.crecimiento[this.crecimiento.length - 1];
  }

  /** ----- Distribución de carteras (dona) ----- */
  carteras: SegmentoCartera[] = [
    { etiqueta: 'Bonos', porcentaje: 40, color: 'var(--green-primary)' },
    { etiqueta: 'Fondos', porcentaje: 22, color: 'var(--green-accent-text)' },
    { etiqueta: 'Acciones', porcentaje: 18, color: 'var(--green-soft)' },
    { etiqueta: 'Bonos corporativos', porcentaje: 15, color: 'var(--bg-ahorro)' },
    { etiqueta: 'Criptomonedas', porcentaje: 5, color: '#e2e8f0' },
  ];

  get gradienteCarteras(): string {
    let acumulado = 0;
    const partes = this.carteras.map(seg => {
      const inicio = acumulado;
      acumulado += seg.porcentaje;
      return `${seg.color} ${inicio}% ${acumulado}%`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  /** ----- Tabla de inversiones ----- */
  filtros = ['Todos', 'Corto plazo', 'Largo plazo', 'Mejores'];
  filtroActivo = signal('Todos');

  get inversiones(): Inversion[] {
    const todas = this.inversionesService.inversiones;
    switch (this.filtroActivo()) {
      case 'Corto plazo':
        return todas.filter((inv) => inv.duracion.includes('mes') || inv.duracion === 'Flexible');
      case 'Largo plazo':
        return todas.filter((inv) => inv.duracion.includes('año'));
      case 'Mejores':
        return [...todas].sort((a, b) => b.rendimiento - a.rendimiento);
      default:
        return todas;
    }
  }

  seleccionarFiltro(f: string): void {
    this.filtroActivo.set(f);
  }

  get montoTotal(): number {
    return this.inversiones.reduce((suma, inv) => suma + inv.monto, 0);
  }

  get rendimientoTotalTabla(): number {
    return this.inversiones.reduce((suma, inv) => suma + inv.rendimiento, 0);
  }

  nuevaInversion(): void {
    const id = Math.max(0, ...this.inversionesService.inversiones.map((i) => i.id)) + 1;
    this.inversionesService.agregarInversion({
      id,
      nombre: `Nueva inversión ${id}`,
      monto: 0,
      rendimiento: 0,
      riesgo: 'Bajo',
      duracion: 'Flexible',
    });
    this.toastService.success('Inversión creada correctamente');
  }

  exportar(): void {
    this.toastService.info('Exportación simulada: el resumen de inversiones se generó correctamente.');
  }
}
