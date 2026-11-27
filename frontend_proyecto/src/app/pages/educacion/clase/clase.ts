import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { Clase, Curso, Leccion } from '../educacion/educacion.model';
import { EducacionService } from '../../../services/educacion';
import { mensajeDeError } from '../../../services/api';
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

  private cursoId = 0;

  // Signals: la pantalla cambia cuando responde el MID
  readonly curso = signal<Curso | null>(null); // temario con lo que ya vio el usuario
  readonly clase = signal<Clase | null>(null); // contenido de la clase abierta
  readonly errorCarga = signal('');
  readonly guardando = signal(false);

  readonly reproduciendo = signal(false);
  readonly avance = signal(0);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.ruta.paramMap.subscribe((params) => {
      this.cursoId = Number(params.get('cursoId'));
      this.detener();
      this.cargar(Number(params.get('leccionId')));
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  /** Pide la clase y el temario del curso al MID. */
  private cargar(leccionId: number): void {
    this.errorCarga.set('');
    this.clase.set(null);

    this.educacionService.obtenerClase(leccionId).subscribe({
      next: (clase) => this.clase.set(clase),
      error: (error) => this.errorCarga.set(mensajeDeError(error)),
    });

    this.recargarCurso().subscribe({
      next: () => this.avance.set(this.leccion()?.completada ? 100 : 0),
      error: (error) => this.errorCarga.set(mensajeDeError(error)),
    });
  }

  private recargarCurso(): Observable<Curso> {
    return this.educacionService.cargarCurso(this.cursoId).pipe(tap((curso) => this.curso.set(curso)));
  }

  /** La lección dentro del temario (de ahí sale si ya está vista). */
  readonly leccion = computed<Leccion | undefined>(() =>
    this.curso()?.lecciones.find((l) => l.id === this.clase()?.id)
  );

  readonly indice = computed(() => {
    const curso = this.curso();
    const leccion = this.leccion();
    return curso && leccion ? curso.lecciones.indexOf(leccion) : -1;
  });

  readonly anterior = computed<Leccion | undefined>(() => {
    const i = this.indice();
    return i > 0 ? this.curso()?.lecciones[i - 1] : undefined;
  });

  /** El MID dice cuál es la siguiente clase (0 si es la última). */
  readonly siguiente = computed<Leccion | undefined>(() =>
    this.curso()?.lecciones.find((l) => l.id === this.clase()?.idSiguiente)
  );

  readonly esVideo = computed(() => this.clase()?.tipo === 'Video');

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
        this.marcarVista().subscribe();
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
    const clase = this.clase();
    if (!clase) return '0:00';
    const segundos = Math.round((this.avance() / 100) * clase.duracionMin * 60);
    return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
  }

  tiempoTotal(): string {
    return `${this.clase()?.duracionMin ?? 0}:00`;
  }

  // ---------- Progreso ----------

  /**
   * Guarda la clase como vista en el MID y vuelve a pedir el temario
   * (así el % y las marcas salen de la base). Devuelve false si falló.
   */
  private marcarVista(): Observable<boolean> {
    const leccion = this.leccion();
    if (!leccion || leccion.completada) return of(true);

    this.guardando.set(true);
    return this.educacionService.completarLeccion(leccion.id).pipe(
      tap(() => {
        this.avance.set(100);
        this.toastService.success(`Clase completada: ${leccion.titulo}`);
      }),
      switchMap(() => this.recargarCurso()),
      map(() => true),
      catchError((error) => {
        this.toastService.error(mensajeDeError(error));
        return of(false);
      }),
      finalize(() => this.guardando.set(false))
    );
  }

  completarYSeguir(): void {
    this.marcarVista().subscribe((guardada) => {
      if (!guardada) return;

      const siguiente = this.siguiente();
      if (siguiente) {
        this.irA(siguiente);
        return;
      }

      this.terminarCurso();
    });
  }

  private terminarCurso(): void {
    const curso = this.curso();
    if (!curso) return;

    if (curso.certificado && curso.progreso === 100) {
      this.router.navigate(['/educacion/curso', curso.id, 'certificado']);
    } else if (curso.progreso === 100) {
      this.toastService.success('Terminaste el curso. Ya puedes tomar el siguiente.');
      this.volverAlCurso();
    } else {
      this.toastService.info('Te faltan clases por ver. Revisa el temario.');
      this.volverAlCurso();
    }
  }

  // ---------- Navegación ----------

  irA(leccion: Leccion): void {
    this.router.navigate(['/educacion/curso', this.cursoId, 'clase', leccion.id]);
  }

  volverAlCurso(): void {
    this.router.navigate(['/educacion/curso', this.cursoId]);
  }

  volverAlCatalogo(): void {
    this.router.navigate(['/educacion']);
  }
}
