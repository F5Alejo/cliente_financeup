import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Leccion } from '../educacion/educacion.model';
import { EducacionService } from '../../../services/educacion';
import { ToastService } from '../../../shared/services/toast';

// La clase simulada avanza en 14 segundos, sin importar su duración real.
const SEGUNDOS_SIMULADOS = 14;

@Component({
  selector: 'app-clase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clase.html',
  styleUrl: './clase.css',
})
export class ClaseComponent implements OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly educacionService = inject(EducacionService);
  private readonly toastService = inject(ToastService);

  private readonly cursoId = signal('');
  private readonly leccionId = signal('');

  readonly reproduciendo = signal(false);
  readonly avance = signal(0);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.ruta.paramMap.subscribe((params) => {
      this.cursoId.set(params.get('cursoId') ?? '');
      this.leccionId.set(params.get('leccionId') ?? '');
      this.detener();
      this.avance.set(this.leccion()?.completada ? 100 : 0);
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  readonly curso = computed(() => {
    this.educacionService.version();
    return this.educacionService.buscarCurso(this.cursoId());
  });

  readonly leccion = computed<Leccion | undefined>(() =>
    this.curso()?.lecciones.find((l) => l.id === this.leccionId())
  );

  readonly indice = computed(() => {
    const curso = this.curso();
    return curso ? this.educacionService.indiceDeLeccion(curso, this.leccionId()) : -1;
  });

  readonly anterior = computed<Leccion | undefined>(() => {
    const i = this.indice();
    return i > 0 ? this.curso()?.lecciones[i - 1] : undefined;
  });

  readonly siguiente = computed<Leccion | undefined>(() => {
    const curso = this.curso();
    const i = this.indice();
    return curso && i >= 0 && i < curso.lecciones.length - 1
      ? curso.lecciones[i + 1]
      : undefined;
  });

  readonly esVideo = computed(() => this.leccion()?.tipo === 'Video');

  readonly leccionesHechas = computed(
    () => this.curso()?.lecciones.filter((l) => l.completada).length ?? 0
  );

  // ---------- Reproducción simulada ----------

  alternarPlay(): void {
    if (this.reproduciendo()) {
      this.detener();
      return;
    }

    if (this.avance() >= 100) {
      this.avance.set(0);
    }

    this.reproduciendo.set(true);
    const paso = 100 / (SEGUNDOS_SIMULADOS * 4);

    this.temporizador = setInterval(() => {
      const nuevo = Math.min(100, this.avance() + paso);
      this.avance.set(nuevo);

      if (nuevo >= 100) {
        this.detener();
        this.marcarVista();
      }
    }, 250);
  }

  private detener(): void {
    this.reproduciendo.set(false);
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  /** Minuto que se muestra en el reproductor según el avance simulado. */
  tiempoActual(): string {
    const leccion = this.leccion();
    if (!leccion) return '0:00';
    const segundos = Math.round((this.avance() / 100) * leccion.duracionMin * 60);
    return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
  }

  tiempoTotal(): string {
    return `${this.leccion()?.duracionMin ?? 0}:00`;
  }

  // ---------- Progreso ----------

  marcarVista(): void {
    const leccion = this.leccion();
    if (!leccion || leccion.completada) return;

    this.educacionService.completarLeccion(this.cursoId(), leccion.id);
    this.avance.set(100);
    this.toastService.success(`Clase completada: ${leccion.titulo}`);
  }

  completarYSeguir(): void {
    this.marcarVista();

    const siguiente = this.siguiente();
    if (siguiente) {
      this.irA(siguiente);
      return;
    }

    this.terminarCurso();
  }

  private terminarCurso(): void {
    const curso = this.curso();
    if (!curso) return;

    if (curso.certificado) {
      this.router.navigate(['/educacion/curso', curso.id, 'certificado']);
    } else {
      this.toastService.success('Terminaste el curso. Ya puedes tomar el siguiente.');
      this.router.navigate(['/educacion/curso', curso.id]);
    }
  }

  // ---------- Navegación ----------

  irA(leccion: Leccion): void {
    this.router.navigate(['/educacion/curso', this.cursoId(), 'clase', leccion.id]);
  }

  volverAlCurso(): void {
    this.router.navigate(['/educacion/curso', this.cursoId()]);
  }

  volverAlCatalogo(): void {
    this.router.navigate(['/educacion']);
  }
}
