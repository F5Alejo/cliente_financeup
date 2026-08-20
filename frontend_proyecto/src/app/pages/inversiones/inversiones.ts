import { Component, signal } from '@angular/core';
import { FinanzasMenuComponent } from '../finanzas/finanzas-menu/finanzas-menu';
interface SegmentoCartera {
  etiqueta: string;
  porcentaje: number;
  color: string;
}

interface PuntoRendimiento {
  periodo: string;
  valor: number;
}

interface Inversion {
  id: number;
  nombre: string;
  monto: number;
  rendimiento: number;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
  duracion: string;
}

@Component({
  selector: 'app-inversiones',
  imports: [FinanzasMenuComponent],
  templateUrl: './inversiones.html',
  styleUrl: './inversiones.css',
})
export class InversionesComponent {
  /** ----- Tarjetas superiores ----- */
  balanceInversiones = 15800000;
  balanceSemana = 250000;
  rendimientoTotal = 1350000;
  rendimientoPorcentaje = 25.8;
  proximoRetiro = '12 abril';
  progresoRetiro = 85;

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
    { etiqueta: 'Bonos', porcentaje: 40, color: '#0f766e' },
    { etiqueta: 'Fondos', porcentaje: 22, color: '#14b8a6' },
    { etiqueta: 'Acciones', porcentaje: 18, color: '#5eead4' },
    { etiqueta: 'Bonos corporativos', porcentaje: 15, color: '#99f6e4' },
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

  inversiones: Inversion[] = [
    { id: 1, nombre: 'Bonos del Gobierno', monto: 8000000, rendimiento: 600000, riesgo: 'Bajo', duracion: '2 años' },
    { id: 2, nombre: 'Fondo de Inversión', monto: 8600000, rendimiento: 800000, riesgo: 'Medio', duracion: '1 año' },
    { id: 3, nombre: 'Acciones Tecnológicas', monto: 7300000, rendimiento: 1300000, riesgo: 'Alto', duracion: '6 meses' },
    { id: 4, nombre: 'Criptomonedas', monto: 1000000, rendimiento: -440000, riesgo: 'Alto', duracion: 'Flexible' },
  ];

  seleccionarFiltro(f: string): void {
    this.filtroActivo.set(f);
  }

  get montoTotal(): number {
    return this.inversiones.reduce((suma, inv) => suma + inv.monto, 0);
  }

  get rendimientoTotalTabla(): number {
    return this.inversiones.reduce((suma, inv) => suma + inv.rendimiento, 0);
  }

  formatearCOP(valor: number): string {
    return `$${Math.abs(valor).toLocaleString('es-CO')}`;
  }

  nuevaInversion(): void {
    // Punto de extensión: abrir el formulario/modal de nueva inversión
  }

  exportar(): void {
    // Punto de extensión: generar el archivo de exportación
  }
}
