import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Curso, EscuelaCursos, OpcionFiltro } from './educacion.model';
import { EducacionService } from '../../../services/educacion';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-educacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BandaSeccionComponent, IconComponent],
  templateUrl: './educacion.html',
  styleUrls: ['./educacion.css'],
})
export class EducacionComponent implements OnInit {
  private educacionService = inject(EducacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly cargando = this.educacionService.cargando;
  readonly error = this.educacionService.error;

  /** Curso a medias con sus lecciones (el catálogo solo trae el %). */
  readonly cursoEnProgreso = signal<Curso | null>(null);

  /** Si se llega con ?escuela=... (ej. desde la campana de Finanzas), se preselecciona ese filtro */
  ngOnInit(): void {
    const escuela = this.route.snapshot.queryParamMap.get('escuela');
    if (escuela) {
      this.escuelaActiva.set(escuela);
    }
    this.cargar();
  }

  /** Pide el catálogo al MID; el % de avance llega aparte y luego se busca el curso a medias. */
  cargar(): void {
    this.educacionService.cargarCatalogo();
  }

  constructor() {
    // Cuando llega el avance, se pide el detalle del curso a medias para la banda "continuar"
    effect(() => {
      const curso = this.educacionService.cursoEnProgreso();
      if (!curso) {
        this.cursoEnProgreso.set(null);
        return;
      }
      untracked(() =>
        this.educacionService.cargarCurso(curso.id).subscribe({
          next: (detalle) => this.cursoEnProgreso.set(detalle),
          error: () => this.cursoEnProgreso.set(null),
        })
      );
    });
  }

  // ---------------------------------------------------------------------
  // FILTROS
  // ---------------------------------------------------------------------

  readonly niveles: OpcionFiltro[] = [
    { id: 'basico', etiqueta: 'Básico' },
    { id: 'intermedio', etiqueta: 'Intermedio' },
    { id: 'avanzado', etiqueta: 'Avanzado' },
  ];

  readonly formatos: OpcionFiltro[] = [
    { id: 'video', etiqueta: 'Video' },
    { id: 'articulo', etiqueta: 'Artículo' },
    { id: 'quiz', etiqueta: 'Quiz' },
  ];

  readonly terminoBusqueda = signal('');
  /** Slug de la escuela, ej: "inversion" */
  readonly escuelaActiva = signal<string | null>(null);
  readonly nivelActivo = signal<string | null>(null);
  readonly formatoActivo = signal<string | null>(null);

  alternarEscuela(id: string): void {
    this.escuelaActiva.set(this.escuelaActiva() === id ? null : id);
  }

  alternarNivel(id: string): void {
    this.nivelActivo.set(this.nivelActivo() === id ? null : id);
  }

  alternarFormato(id: string): void {
    this.formatoActivo.set(this.formatoActivo() === id ? null : id);
  }

  limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.escuelaActiva.set(null);
    this.nivelActivo.set(null);
    this.formatoActivo.set(null);
  }

  readonly hayFiltros = computed(
    () =>
      this.terminoBusqueda().trim() !== '' ||
      this.escuelaActiva() !== null ||
      this.nivelActivo() !== null ||
      this.formatoActivo() !== null
  );

  readonly escuelas = this.educacionService.escuelas;

  /** Escuelas ya filtradas por búsqueda/escuela/nivel/formato, listas para pintar. */
  readonly escuelasFiltradas = computed<EscuelaCursos[]>(() => {
    const termino = this.terminoBusqueda().trim().toLowerCase();
    const escuelaId = this.escuelaActiva();
    const nivel = this.niveles.find((n) => n.id === this.nivelActivo())?.etiqueta;
    const formato = this.formatos.find((f) => f.id === this.formatoActivo())?.etiqueta;

    return this.educacionService
      .escuelas()
      .filter((escuela) => !escuelaId || escuela.slug === escuelaId)
      .map((escuela) => ({
        ...escuela,
        cursos: escuela.cursos.filter((curso) => {
          const coincideTexto =
            !termino ||
            curso.titulo.toLowerCase().includes(termino) ||
            curso.descripcion.toLowerCase().includes(termino) ||
            curso.instructor.nombre.toLowerCase().includes(termino);

          return (
            coincideTexto &&
            (!nivel || curso.nivel === nivel) &&
            (!formato || curso.formato === formato)
          );
        }),
      }))
      .filter((escuela) => escuela.cursos.length > 0);
  });

  readonly totalResultados = computed(() =>
    this.escuelasFiltradas().reduce((total, e) => total + e.cursos.length, 0)
  );

  // ---------------------------------------------------------------------
  // BANDA "CONTINÚA DONDE QUEDASTE"
  // ---------------------------------------------------------------------

  leccionesHechas(curso: Curso): number {
    return curso.lecciones.filter((l) => l.completada).length;
  }

  minutosRestantes(curso: Curso): number {
    return this.educacionService.minutosRestantes(curso);
  }

  siguienteLeccionTitulo(curso: Curso): string {
    return this.educacionService.siguienteLeccion(curso)?.titulo ?? '';
  }

  siguienteLeccionNumero(curso: Curso): number {
    const siguiente = this.educacionService.siguienteLeccion(curso);
    return siguiente ? curso.lecciones.indexOf(siguiente) + 1 : 1;
  }

  // ---------------------------------------------------------------------
  // NAVEGACIÓN
  // ---------------------------------------------------------------------

  abrirCurso(curso: Curso): void {
    this.router.navigate(['/educacion/curso', curso.id]);
  }

  reanudar(curso: Curso): void {
    const leccion = this.educacionService.siguienteLeccion(curso);
    if (!leccion) {
      this.abrirCurso(curso);
      return;
    }
    this.router.navigate(['/educacion/curso', curso.id, 'clase', leccion.id]);
  }
}
