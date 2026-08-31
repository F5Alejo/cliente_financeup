import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MetasService, Meta } from '../../../services/metas';
import { ToastService } from '../../../shared/services/toast';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

@Component({
  selector: 'app-metas',
  imports: [FormsModule, FinanzasMenuComponent, CursoBannerComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class MetasComponent {
  constructor(
    private metasService: MetasService,
    private toastService: ToastService
  ) {}

  get metas(): Meta[] {
    const orden = this.ordenAscendente() ? 1 : -1;
    return [...this.metasService.metas].sort((a, b) => (a.porcentaje - b.porcentaje) * orden);
  }

  get metasAlcanzadas(): number {
    return this.metas.filter((m) => m.cumplida).length;
  }

  get totalMetas(): number {
    return this.metas.length;
  }

  get totalAhorrado(): number {
    return this.metas.reduce((suma, m) => suma + m.actual, 0);
  }

  get totalObjetivo(): number {
    return this.metas.reduce((suma, m) => suma + m.objetivo, 0);
  }

  get progresoGeneral(): number {
    return this.totalObjetivo > 0
      ? Math.round((this.totalAhorrado / this.totalObjetivo) * 100)
      : 0;
  }

  progresoMeta(meta: Meta): number {
    return meta.porcentaje;
  }

  notaPrincipal(meta: Meta): string {
    return meta.cumplida ? 'Meta alcanzada' : 'En progreso';
  }

  notaSecundaria(meta: Meta): string {
    if (meta.cumplida) return '¡Felicidades!';
    const faltante = `Faltan ${this.formatearCOP(meta.objetivo - meta.actual)}`;
    return meta.porcentaje >= 90 ? `¡Ya casi lo logras! ${faltante}` : faltante;
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  /** Ordena las metas por porcentaje de avance, para ver primero las que más lo necesitan */
  ordenAscendente = signal(true);

  masOpciones(): void {
    this.ordenAscendente.update((v) => !v);
  }

  /** ----- Abonar dinero a una meta existente ----- */
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

  confirmarAbono(meta: Meta): void {
    if (!this.montoAbono || this.montoAbono <= 0) {
      this.toastService.info('Ingresa un monto válido para abonar.');
      return;
    }

    this.metasService.editarMeta(meta.id, { actual: meta.actual + this.montoAbono });
    this.toastService.success(`Abonaste ${this.formatearCOP(this.montoAbono)} a "${meta.nombre}".`);
    this.cancelarAbono();
  }

  /** ----- Formulario de nueva meta (funcional) ----- */
  mostrarFormularioMeta = signal(false);

  nombreNuevaMeta: string = '';
  objetivoNuevaMeta: number | null = null;

  toggleFormularioMeta(): void {
    this.mostrarFormularioMeta.update((v) => !v);
  }

  guardarNuevaMeta(): void {
    const nombre = this.nombreNuevaMeta.trim();
    const objetivo = this.objetivoNuevaMeta;

    if (!nombre || objetivo === null || objetivo <= 0) {
      return; // validación mínima: no guarda si falta el nombre o el monto es inválido
    }

    this.metasService.agregarMeta({
      nombre,
      icono: '🎯',
      actual: 0,
      objetivo,
    });
    this.toastService.success('Meta creada correctamente');

    this.nombreNuevaMeta = '';
    this.objetivoNuevaMeta = null;
    this.mostrarFormularioMeta.set(false);
  }
}
