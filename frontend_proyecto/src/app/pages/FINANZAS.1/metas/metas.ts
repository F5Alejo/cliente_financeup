import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MetasService, Meta } from '../../../services/metas';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-metas',
  imports: [FormsModule, FinanzasMenuComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class MetasComponent {
  constructor(
    private metasService: MetasService,
    private toastService: ToastService
  ) {}

  get metas(): Meta[] {
    return this.metasService.metas;
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
    return meta.cumplida
      ? '¡Felicidades!'
      : `Faltan ${this.formatearCOP(meta.objetivo - meta.actual)}`;
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  masOpciones(): void {
    // Punto de extensión: menú de opciones (editar, eliminar, ordenar, etc.)
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
