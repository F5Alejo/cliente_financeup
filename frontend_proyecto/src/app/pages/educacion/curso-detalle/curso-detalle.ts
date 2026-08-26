import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Curso, Leccion } from '../educacion/educacion.model';
import { EducacionService } from '../../../services/educacion';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css',
})
export class CursoDetalleComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly educacionService = inject(EducacionService);
  private readonly toastService = inject(ToastService);

  private readonly cursoId = signal(this.ruta.snapshot.paramMap.get('cursoId') ?? '');

  readonly curso = computed<Curso | undefined>(() => {
    this.educacionService.version();
    return this.educacionService.buscarCurso(this.cursoId());
  });

  readonly escuela = computed(() =>
    this.educacionService.escuelaDeCurso(this.cursoId())
  );

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
    if (!curso) return 1;
    const siguiente = this.educacionService.siguienteLeccion(curso);
    return this.educacionService.indiceDeLeccion(curso, siguiente.id) + 1;
  }

  esSiguiente(leccion: Leccion): boolean {
    const curso = this.curso();
    if (!curso || curso.progreso === 100) return false;
    return this.educacionService.siguienteLeccion(curso).id === leccion.id;
  }

  // ---------- Acciones ----------

  comenzar(): void {
    const curso = this.curso();
    if (!curso) return;

    const destino =
      curso.progreso === 100
        ? curso.lecciones[0]
        : this.educacionService.siguienteLeccion(curso);

    this.router.navigate(['/educacion/curso', curso.id, 'clase', destino.id]);
  }

  abrirLeccion(leccion: Leccion): void {
    this.router.navigate(['/educacion/curso', this.cursoId(), 'clase', leccion.id]);
  }

  reiniciar(): void {
    this.educacionService.reiniciarCurso(this.cursoId());
    this.toastService.info('Progreso reiniciado. Puedes empezar de nuevo.');
  }

  verCertificado(): void {
    this.router.navigate(['/educacion/curso', this.cursoId(), 'certificado']);
  }

  volver(): void {
    this.router.navigate(['/educacion']);
  }
}
