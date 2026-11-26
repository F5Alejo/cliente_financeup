import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { InversionesService, Inversion } from '../../../services/inversiones';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { BotonComponent } from '../../../shared/components/ui/boton/boton';
import { GraficaLineaComponent, PuntoLinea } from '../../../shared/graficas/grafica-linea';
import { BarraPartesComponent, Parte } from '../../../shared/graficas/barra-partes';
import { MedidorComponent } from '../../../shared/graficas/medidor';

type Riesgo = Inversion['riesgo'];
type Reparto = 'inversion' | 'riesgo';
type FiltroTabla = 'todas' | 'corto' | 'largo';

/** Altura de cada nivel de riesgo, en tramos de 1 a 3 (la misma forma del logo). */
const NIVEL_RIESGO: Record<Riesgo, number> = { Bajo: 1, Medio: 2, Alto: 3 };

@Component({
  selector: 'app-inversiones',
  imports: [
    FinanzasMenuComponent,
    FormsModule,
    MonedaPipe,
    CursoBannerComponent,
    BandaSeccionComponent,
    IconComponent,
    BotonComponent,
    GraficaLineaComponent,
    BarraPartesComponent,
    MedidorComponent,
  ],
  templateUrl: './inversiones.html',
  styleUrls: ['../finanzas-pagina.css', './inversiones.css'],
})
export class InversionesComponent {
  private inversionesService = inject(InversionesService);
  private toastService = inject(ToastService);

  // ---------------------------------------------------------------
  // Resumen
  // ---------------------------------------------------------------

  get totalInvertido(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.monto, 0);
  }

  get rendimientoTotal(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.rendimiento, 0);
  }

  get valorActual(): number {
    return this.inversionesService.valorActual;
  }

  get rendimientoPct(): number {
    return this.totalInvertido > 0 ? Math.round((this.rendimientoTotal / this.totalInvertido) * 1000) / 10 : 0;
  }

  get balanceSemana(): number {
    return this.inversionesService.balanceSemana;
  }

  get proximoRetiro(): string {
    return this.inversionesService.proximoRetiro;
  }

  get progresoRetiro(): number {
    return this.inversionesService.progresoRetiro;
  }

  /** Aviso si la mitad o más de lo invertido está en riesgo alto. */
  get pctRiesgoAlto(): number {
    const total = this.totalInvertido;
    if (total === 0) return 0;
    const alto = this.inversionesService.inversiones.filter((i) => i.riesgo === 'Alto').reduce((s, i) => s + i.monto, 0);
    return Math.round((alto / total) * 100);
  }

  // ---------------------------------------------------------------
  // Crecimiento
  // ---------------------------------------------------------------

  readonly periodos = [
    { meses: 3, etiqueta: '3 meses' },
    { meses: 6, etiqueta: '6 meses' },
    { meses: 12, etiqueta: '1 año' },
  ];
  periodo = signal(6);

  get crecimiento(): PuntoLinea[] {
    return this.inversionesService.historial(this.periodo());
  }

  /** Los 12 meses, para el horizonte del fondo de la banda. */
  get horizonteBanda(): number[] {
    return this.inversionesService.historial(12).map((p) => p.valor);
  }

  get crecimientoPct(): number {
    const p = this.crecimiento;
    return p.length > 1 && p[0].valor > 0 ? Math.round(((p[p.length - 1].valor - p[0].valor) / p[0].valor) * 1000) / 10 : 0;
  }

  get etiquetaPeriodo(): string {
    return this.periodos.find((p) => p.meses === this.periodo())?.etiqueta ?? '';
  }

  // ---------------------------------------------------------------
  // Reparto
  // ---------------------------------------------------------------

  reparto = signal<Reparto>('inversion');

  get partes(): Parte[] {
    const lista = this.inversionesService.inversiones;
    if (this.reparto() === 'inversion') {
      return lista.map((i) => ({ etiqueta: i.nombre, valor: i.monto }));
    }
    const porRiesgo: Riesgo[] = ['Bajo', 'Medio', 'Alto'];
    return porRiesgo
      .map((r) => ({ etiqueta: `Riesgo ${r.toLowerCase()}`, valor: lista.filter((i) => i.riesgo === r).reduce((s, i) => s + i.monto, 0) }))
      .filter((p) => p.valor > 0);
  }

  /** La parte más grande, para la frase de lectura. */
  get mayorParte(): { etiqueta: string; pct: number } | null {
    const partes = [...this.partes].sort((a, b) => b.valor - a.valor);
    const total = this.totalInvertido;
    if (!partes.length || total === 0) return null;
    return { etiqueta: partes[0].etiqueta, pct: Math.round((partes[0].valor / total) * 100) };
  }

  // ---------------------------------------------------------------
  // Tabla
  // ---------------------------------------------------------------

  readonly filtros: { id: FiltroTabla; etiqueta: string }[] = [
    { id: 'todas', etiqueta: 'Todas' },
    { id: 'corto', etiqueta: 'Corto plazo' },
    { id: 'largo', etiqueta: 'Largo plazo' },
  ];
  filtro = signal<FiltroTabla>('todas');
  /** Ordenar por rendimiento (de mayor a menor) en lugar del orden de registro. */
  porRendimiento = signal(false);

  get inversiones(): Inversion[] {
    let lista = [...this.inversionesService.inversiones];
    if (this.filtro() === 'corto') lista = lista.filter((i) => i.duracion.includes('mes') || i.duracion === 'Flexible');
    if (this.filtro() === 'largo') lista = lista.filter((i) => i.duracion.includes('año'));
    if (this.porRendimiento()) lista.sort((a, b) => this.pctDe(b) - this.pctDe(a));
    return lista;
  }

  get montoTabla(): number {
    return this.inversiones.reduce((s, i) => s + i.monto, 0);
  }

  get rendimientoTabla(): number {
    return this.inversiones.reduce((s, i) => s + i.rendimiento, 0);
  }

  pctDe(inv: Inversion): number {
    return inv.monto > 0 ? Math.round((inv.rendimiento / inv.monto) * 1000) / 10 : 0;
  }

  nivel(riesgo: Riesgo): number {
    return NIVEL_RIESGO[riesgo];
  }

  abs(n: number): number {
    return Math.abs(n);
  }

  /** Descarga un Excel con todas las inversiones. */
  exportar(): void {
    const datos = this.inversionesService.inversiones.map((inv) => ({
      Nombre: inv.nombre,
      Monto: inv.monto,
      Rendimiento: inv.rendimiento,
      'Rendimiento %': this.pctDe(inv),
      Riesgo: inv.riesgo,
      Duracion: inv.duracion,
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Inversiones');
    XLSX.writeFile(libro, 'mis-inversiones.xlsx');
    this.toastService.success('Descargaste tus inversiones en Excel.');
  }

  // ---------------------------------------------------------------
  // Nueva inversión
  // ---------------------------------------------------------------

  mostrarFormularioInversion = signal(false);
  private siguienteIdInversion = 100;

  nombreNuevaInversion = '';
  montoNuevaInversion: number | null = null;
  riesgoNuevaInversion: Riesgo = 'Bajo';
  duracionNuevaInversion = '';

  readonly riesgos: Riesgo[] = ['Bajo', 'Medio', 'Alto'];

  toggleFormularioInversion(): void {
    this.mostrarFormularioInversion.update((v) => !v);
  }

  guardarNuevaInversion(): void {
    const nombre = this.nombreNuevaInversion.trim();
    const monto = this.montoNuevaInversion;
    if (!nombre || monto === null || monto <= 0) {
      this.toastService.info('Ponle un nombre y un monto a la inversión.');
      return;
    }

    this.inversionesService.agregarInversion({
      id: this.siguienteIdInversion++,
      nombre,
      monto,
      rendimiento: 0, // aún no ha generado retorno
      riesgo: this.riesgoNuevaInversion,
      duracion: this.duracionNuevaInversion.trim() || 'Sin definir',
    });
    this.toastService.success(`Agregaste «${nombre}» a tu portafolio.`);

    this.nombreNuevaInversion = '';
    this.montoNuevaInversion = null;
    this.riesgoNuevaInversion = 'Bajo';
    this.duracionNuevaInversion = '';
    this.mostrarFormularioInversion.set(false);
  }
}
