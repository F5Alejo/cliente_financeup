import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Certificado, Curso } from '../educacion/educacion.model';
import { EducacionService } from '../../../services/educacion';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-certificado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado.html',
  styleUrl: './certificado.css',
})
export class CertificadoComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly educacionService = inject(EducacionService);
  private readonly toastService = inject(ToastService);

  private readonly cursoId = Number(this.ruta.snapshot.paramMap.get('cursoId'));

  // Signals: la pantalla cambia cuando responde el MID
  readonly certificado = signal<Certificado | null>(null);
  readonly curso = signal<Curso | null>(null); // para el instructor y las clases
  readonly error = signal('');

  readonly escuela = computed(() => this.educacionService.escuelaDeCurso(this.cursoId));

  constructor() {
    if (this.educacionService.escuelas().length === 0) {
      this.educacionService.cargarCatalogo();
    }

    // El MID solo lo entrega si el curso va al 100%; si ya existía, devuelve el mismo código
    this.educacionService.emitirCertificado(this.cursoId).subscribe({
      next: (certificado) => this.certificado.set(certificado),
      error: (error) => this.error.set(mensajeDeError(error)),
    });

    this.educacionService.cargarCurso(this.cursoId).subscribe({
      next: (curso) => this.curso.set(curso),
      error: () => this.curso.set(null),
    });
  }

  /** "2026-11-25" → "25 de noviembre de 2026" */
  readonly fecha = computed(() => {
    const emision = this.certificado()?.fechaEmision;
    if (!emision) return '';
    const [anio, mes, dia] = emision.split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  readonly minutos = computed(() =>
    (this.curso()?.lecciones ?? []).reduce((total, l) => total + l.duracionMin, 0)
  );

  descargar(): void {
    this.toastService.info('Abriendo el diálogo de impresión para guardarlo en PDF.');
    window.print();
  }

  volverAlCurso(): void {
    this.router.navigate(['/educacion/curso', this.cursoId]);
  }

  seguirAprendiendo(): void {
    this.router.navigate(['/educacion']);
  }
}
