import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Curso, Leccion } from '../educacion/educacion.model';
import { EducacionService } from '../../../services/educacion';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, BandaSeccionComponent, IconComponent],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css',
})
export class CursoDetalleComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly educacionService = inject(EducacionService);
  private readonly toastService = inject(ToastService);

  private readonly cursoId = Number(this.ruta.snapshot.paramMap.get('cursoId'));

  // Signals: la pantalla cambia cuando responde el MID
  readonly curso = signal<Curso | null>(null);
  readonly errorCarga = signal('');
  readonly reiniciando = signal(false);

  /** Nombre de la escuela, sale del catálogo (se pide si aún no está). */
  readonly escuela = computed(() => this.educacionService.escuelaDeCurso(this.cursoId));

  constructor() {
    if (this.educacionService.escuelas().length === 0) {
      this.educacionService.cargarCatalogo();
    }
    this.cargarCurso();
  }

  cargarCurso(): void {
    this.errorCarga.set('');
    this.educacionService.cargarCurso(this.cursoId).subscribe({
      next: (curso) => this.curso.set(curso),
      error: (error) => this.errorCarga.set(mensajeDeError(error)),
    });
  }

  readonly leccionesHechas = computed(
    () => this.curso()?.lecciones.filter((l) => l.completada).length ?? 0
  );

  readonly minutosTotales = computed(() =>
    (this.curso()?.lecciones ?? []).reduce((total, l) => total + l.duracionMin, 0)
  );

  readonly minutosRestantes = computed(() => {
    const curso = this.curso();
    return curso ? this.educacionService.minutosRestantes(curso) : 0;
  });

  /** El texto del botón principal cambia según dónde va el usuario. */
  readonly textoAccion = computed(() => {
    const progreso = this.curso()?.progreso ?? 0;
    if (progreso === 0) return 'Comenzar curso';
    if (progreso === 100) return 'Repasar el curso';
    return `Reanudar clase ${this.numeroSiguiente()}`;
  });

  numeroSiguiente(): number {
    const curso = this.curso();
    const siguiente = curso ? this.educacionService.siguienteLeccion(curso) : undefined;
    return curso && siguiente ? curso.lecciones.indexOf(siguiente) + 1 : 1;
  }

  esSiguiente(leccion: Leccion): boolean {
    const curso = this.curso();
    if (!curso || curso.progreso === 100) return false;
    return this.educacionService.siguienteLeccion(curso)?.id === leccion.id;
  }

  // ---------- Acciones ----------

  comenzar(): void {
    const curso = this.curso();
    if (!curso || curso.lecciones.length === 0) {
      this.toastService.info('Este curso todavía no tiene clases.');
      return;
    }

    const destino =
      curso.progreso === 100 ? curso.lecciones[0] : this.educacionService.siguienteLeccion(curso)!;

    this.abrirLeccion(destino);
  }

  abrirLeccion(leccion: Leccion): void {
    this.router.navigate(['/educacion/curso', this.cursoId, 'clase', leccion.id]);
  }

  /** El MID deja las clases sin ver; luego se vuelve a pedir el curso. */
  reiniciar(): void {
    this.reiniciando.set(true);
    this.educacionService.reiniciarCurso(this.cursoId).subscribe({
      next: () => {
        this.reiniciando.set(false);
        this.toastService.info('Progreso reiniciado. Puedes empezar de nuevo.');
        this.cargarCurso();
      },
      error: (error) => {
        this.reiniciando.set(false);
        this.toastService.error(mensajeDeError(error));
      },
    });
  }

  verCertificado(): void {
    this.router.navigate(['/educacion/curso', this.cursoId, 'certificado']);
  }

  volver(): void {
    this.router.navigate(['/educacion']);
  }
}
