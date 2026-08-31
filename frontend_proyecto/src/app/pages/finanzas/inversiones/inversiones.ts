import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { InversionesService, Inversion } from '../../../services/inversiones';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import * as XLSX from 'xlsx';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

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
  imports: [FinanzasMenuComponent, FormsModule, MonedaPipe, CursoBannerComponent],
  templateUrl: './inversiones.html',
  styleUrl: './inversiones.css',
})
export class InversionesComponent {
  constructor(
    private inversionesService: InversionesService,
    private toastService: ToastService
  ) {}


  /** ----- Tarjetas superiores, calculadas sumando las inversiones reales ----- */
  get balanceInversiones(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.monto, 0);
  }
  get balanceSemana() { return this.inversionesService.balanceSemana; }
  get rendimientoTotal(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.rendimiento, 0);
  }
  get rendimientoPorcentaje(): number {
    return this.balanceInversiones > 0 ? Math.round((this.rendimientoTotal / this.balanceInversiones) * 1000) / 10 : 0;
  }
  get proximoRetiro() { return this.inversionesService.proximoRetiro; }
  get progresoRetiro() { return this.inversionesService.progresoRetiro; }

  /** ----- Alerta si el usuario tiene mucho dinero concentrado en riesgo Alto ----- */
  get alertaConcentracion(): { mostrar: boolean; mensaje: string } {
    const total = this.balanceInversiones;
    if (total === 0) return { mostrar: false, mensaje: '' };

    const enRiesgoAlto = this.inversionesService.inversiones
      .filter(i => i.riesgo === 'Alto')
      .reduce((s, i) => s + i.monto, 0);
    const porcentaje = Math.round((enRiesgoAlto / total) * 100);

    if (porcentaje >= 50) {
      return { mostrar: true, mensaje: `El ${porcentaje}% de tu dinero invertido está en riesgo alto. Considera diversificar en opciones de menor riesgo.` };
    }
    return { mostrar: false, mensaje: '' };
  }

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

  /** ----- Distribución de carteras (dona), calculada desde las inversiones reales ----- */
  private paletaCarteras = ['var(--sage)', 'var(--black)', 'var(--sand)', 'var(--cloud)', 'var(--sage-dark)', 'var(--sage-tint)'];

  get carteras(): SegmentoCartera[] {
    const total = this.balanceInversiones;
    if (total === 0) return [];
    return this.inversionesService.inversiones.map((inv, i) => ({
      etiqueta: inv.nombre,
      porcentaje: Math.round((inv.monto / total) * 100),
      color: this.paletaCarteras[i % this.paletaCarteras.length],
    }));
  }

  get gradienteCarteras(): string {
    if (this.carteras.length === 0) return 'var(--cloud)';
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

  /** Descarga un Excel real con todas las inversiones */
  exportar(): void {
    const datos = this.inversionesService.inversiones.map(inv => ({
      Nombre: inv.nombre,
      Monto: inv.monto,
      Rendimiento: inv.rendimiento,
      Riesgo: inv.riesgo,
      Duracion: inv.duracion,
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Inversiones');
    XLSX.writeFile(libro, 'mis-inversiones.xlsx');
    this.toastService.success('Inversiones exportadas correctamente.');
  }

  /** ----- Formulario de nueva inversión (funcional) ----- */
  mostrarFormularioInversion = signal(false);
  private siguienteIdInversion = 100;

  nombreNuevaInversion: string = '';
  montoNuevaInversion: number | null = null;
  riesgoNuevaInversion: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
  duracionNuevaInversion: string = '';

  toggleFormularioInversion(): void {
    this.mostrarFormularioInversion.update(v => !v);
  }

  guardarNuevaInversion(): void {
    const nombre = this.nombreNuevaInversion.trim();
    const monto = this.montoNuevaInversion;

    if (!nombre || monto === null || monto <= 0) {
      return; // validación mínima
    }

    this.inversiones.push({
      id: this.siguienteIdInversion++,
      nombre,
      monto,
      rendimiento: 0, // rendimiento inicial en 0, aún no ha generado retorno
      riesgo: this.riesgoNuevaInversion,
      duracion: this.duracionNuevaInversion.trim() || 'Sin definir',
    });

    // limpiar formulario
    this.nombreNuevaInversion = '';
    this.montoNuevaInversion = null;
    this.riesgoNuevaInversion = 'Bajo';
    this.duracionNuevaInversion = '';
    this.mostrarFormularioInversion.set(false);
  }
}