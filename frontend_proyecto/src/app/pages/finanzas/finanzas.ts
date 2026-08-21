import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';

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

interface Movimiento {
  id: number;
  icono: string;
  categoria: string;
  fecha: string;
  monto: number;
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
  imports: [FinanzasMenuComponent],
  templateUrl: './finanzas.html',
  styleUrls: ['./finanzas.css']
  
  
})
export class FinanzasComponent implements OnInit {
  constructor(public authService: AuthService) {}

  usuario: string = '';
  mesActual: string = 'Marzo 2026';

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
    { etiqueta: 'Vivienda', porcentaje: 33, color: '#0f766e' },
    { etiqueta: 'Alimento', porcentaje: 25, color: '#14b8a6' },
    { etiqueta: 'Transporte', porcentaje: 18, color: '#5eead4' },
    { etiqueta: 'Ahorro', porcentaje: 15, color: '#99f6e4' },
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

  /** ----- Movimientos recientes ----- */
  movimientos: Movimiento[] = [
    { id: 1, icono: '🏠', categoria: 'Vivienda', fecha: '2 mar 2026', monto: 150000 },
    { id: 2, icono: '🍽️', categoria: 'Alimentación', fecha: '5 mar 2026', monto: -150000 },
    { id: 3, icono: '🚗', categoria: 'Transporte', fecha: '8 mar 2026', monto: 100000 },
  ];

  formatearMonto(valor: number): string {
    const signo = valor < 0 ? '-' : '+';
    return `${signo}$${Math.abs(valor).toLocaleString('es-CO')}`;
  }

  /** ----- Tus metas (anillos) ----- */
  metas: Meta[] = [
    { nombre: 'Vacaciones', icono: '✈️', porcentaje: 72, actual: 1800000, objetivo: 2500000 },
    { nombre: 'Emergencia', icono: '🛟', porcentaje: 40, actual: 800000, objetivo: 2000000 },
    { nombre: 'Educación', icono: '🎓', porcentaje: 100, actual: 5000000, objetivo: 5000000 },
    { nombre: 'Auto', icono: '🚙', porcentaje: 25, actual: 1250000, objetivo: 5000000 },
  ];

  obtenerOffset(porcentaje: number): number {
    return this.circunferencia * (1 - porcentaje / 100);
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  verTodos(): void {
    // Punto de extensión: navegar al historial completo de movimientos
  }
}