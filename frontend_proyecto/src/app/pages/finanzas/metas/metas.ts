import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MetasService, Meta } from '../../../services/metas';
import { ToastService } from '../../../shared/services/toast';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { MedidorComponent } from '../../../shared/graficas/medidor';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { pesos, pesosCortos } from '../../../shared/graficas/comun';
import { BotonComponent } from '../../../shared/components/ui/boton/boton';

type Filtro = 'curso' | 'cumplidas' | 'todas';

/** Abonos rápidos sugeridos, en pesos. */
const ABONOS_RAPIDOS = [50_000, 100_000, 200_000];

@Component({
  selector: 'app-metas',
  imports: [FormsModule, FinanzasMenuComponent, CursoBannerComponent, BandaSeccionComponent, IconComponent, MedidorComponent, MonedaPipe, BotonComponent],
  templateUrl: './metas.html',
  styleUrls: ['../finanzas-pagina.css', './metas.css'],
})
export class MetasComponent {
  private metasService = inject(MetasService);
  private toastService = inject(ToastService);

  readonly abonosRapidos = ABONOS_RAPIDOS;
  readonly corto = pesosCortos;

  // ---------------------------------------------------------------
  // Listado, filtro y orden
  // ---------------------------------------------------------------

  filtro = signal<Filtro>('curso');
  /** true: primero las que menos avance llevan (las que más atención piden). */
  ordenAscendente = signal(false);

  readonly filtros: { id: Filtro; etiqueta: string }[] = [
    { id: 'curso', etiqueta: 'En curso' },
    { id: 'cumplidas', etiqueta: 'Cumplidas' },
    { id: 'todas', etiqueta: 'Todas' },
  ];

  get metas(): Meta[] {
    const orden = this.ordenAscendente() ? 1 : -1;
    const filtro = this.filtro();
    return this.metasService.metas
      .filter((m) => filtro === 'todas' || (filtro === 'cumplidas' ? m.cumplida : !m.cumplida))
      .sort((a, b) => (a.porcentaje - b.porcentaje) * orden);
  }

  conteo(filtro: Filtro): number {
    const todas = this.metasService.metas;
    if (filtro === 'todas') return todas.length;
    return todas.filter((m) => (filtro === 'cumplidas' ? m.cumplida : !m.cumplida)).length;
  }

  alternarOrden(): void {
    this.ordenAscendente.update((v) => !v);
  }

  // ---------------------------------------------------------------
  // Resumen de la banda
  // ---------------------------------------------------------------

  get metasAlcanzadas(): number {
    return this.metasService.metas.filter((m) => m.cumplida).length;
  }

  get totalMetas(): number {
    return this.metasService.metas.length;
  }

  get totalAhorrado(): number {
    return this.metasService.metas.reduce((s, m) => s + m.actual, 0);
  }

  get totalObjetivo(): number {
    return this.metasService.metas.reduce((s, m) => s + m.objetivo, 0);
  }

  get pctGeneral(): number {
    return this.totalObjetivo > 0 ? Math.round((this.totalAhorrado / this.totalObjetivo) * 100) : 0;
  }

  /** Avance de cada meta de menor a mayor: el horizonte del fondo de la banda. */
  get horizonteMetas(): number[] {
    return this.metasService.metas.map((m) => m.porcentaje).sort((a, b) => a - b);
  }

  /** Suma de los aportes mensuales sugeridos de las metas en curso con fecha límite. */
  get aporteMensualTotal(): number {
    return this.metasService.metas.reduce((s, m) => s + (this.aporteMensual(m) ?? 0), 0);
  }

  // ---------------------------------------------------------------
  // Detalle de cada meta
  // ---------------------------------------------------------------

  faltante(meta: Meta): number {
    return Math.max(0, meta.objetivo - meta.actual);
  }

  /** Meses enteros que quedan hasta la fecha límite (mínimo 1), o null si no tiene fecha. */
  mesesRestantes(meta: Meta): number | null {
    if (!meta.fechaLimite) return null;
    const limite = new Date(`${meta.fechaLimite}T00:00:00`);
    const hoy = new Date();
    const meses = (limite.getFullYear() - hoy.getFullYear()) * 12 + (limite.getMonth() - hoy.getMonth());
    return Math.max(1, meses);
  }

  /** Cuánto apartar cada mes para llegar a tiempo, o null si no tiene fecha o ya se cumplió. */
  aporteMensual(meta: Meta): number | null {
    const meses = this.mesesRestantes(meta);
    if (meses === null || meta.cumplida) return null;
    return Math.ceil(this.faltante(meta) / meses / 1000) * 1000;
  }

  fechaLegible(fecha: string): string {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  // ---------------------------------------------------------------
  // Abonar dinero a una meta
  // ---------------------------------------------------------------

  metaAbonando = signal<number | null>(null);
  montoAbono: number | null = null;

  abrirAbono(id: number): void {
    this.metaAbonando.set(id);
    this.montoAbono = null;
  }

  cancelarAbono(): void {
    this.metaAbonando.set(null);
    this.montoAbono = null;
  }

  abonar(meta: Meta, monto: number | null): void {
    if (!monto || monto <= 0) {
      this.toastService.info('Escribe un monto mayor que cero.');
      return;
    }
    const nuevo = meta.actual + monto;
    this.metasService.editarMeta(meta.id, { actual: nuevo });
    this.toastService.success(
      nuevo >= meta.objetivo
        ? `¡Cumpliste «${meta.nombre}»!`
        : `Abonaste ${pesos(monto)} a «${meta.nombre}».`,
    );
    this.cancelarAbono();
  }

  // ---------------------------------------------------------------
  // Nueva meta
  // ---------------------------------------------------------------

  mostrarFormularioMeta = signal(false);
  nombreNuevaMeta = '';
  objetivoNuevaMeta: number | null = null;
  inicialNuevaMeta: number | null = null;
  fechaNuevaMeta = '';

  /** Mes mínimo para la fecha límite: el próximo. */
  readonly fechaMinima = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  })();

  toggleFormularioMeta(): void {
    this.mostrarFormularioMeta.update((v) => !v);
  }

  get aporteNuevaMeta(): number | null {
    const objetivo = this.objetivoNuevaMeta ?? 0;
    if (!this.fechaNuevaMeta || objetivo <= 0) return null;
    return this.aporteMensual({
      id: 0, nombre: '', icono: 'target', porcentaje: 0, cumplida: false,
      actual: this.inicialNuevaMeta ?? 0, objetivo, fechaLimite: this.fechaNuevaMeta,
    });
  }

  guardarNuevaMeta(): void {
    const nombre = this.nombreNuevaMeta.trim();
    const objetivo = this.objetivoNuevaMeta;
    if (!nombre || objetivo === null || objetivo <= 0) {
      this.toastService.info('Ponle un nombre y un monto objetivo a la meta.');
      return;
    }

    this.metasService.agregarMeta({
      nombre,
      icono: 'target',
      actual: Math.max(0, this.inicialNuevaMeta ?? 0),
      objetivo,
      fechaLimite: this.fechaNuevaMeta || undefined,
    });
    this.toastService.success('Meta creada.');

    this.nombreNuevaMeta = '';
    this.objetivoNuevaMeta = null;
    this.inicialNuevaMeta = null;
    this.fechaNuevaMeta = '';
    this.mostrarFormularioMeta.set(false);
    this.filtro.set('curso');
  }
}
