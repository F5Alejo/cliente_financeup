import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Curso, EscuelaCursos, OpcionFiltro } from './educacion.model';
import { EducacionService } from '../../../services/educacion';

@Component({
  selector: 'app-educacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './educacion.html',
  styleUrls: ['./educacion.css'],
})
export class EducacionComponent {
  constructor(
    private educacionService: EducacionService,
    private router: Router
  ) {}

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

  get escuelas(): EscuelaCursos[] {
    return this.educacionService.escuelas;
  }

  /** Escuelas ya filtradas por búsqueda/escuela/nivel/formato, listas para pintar. */
  readonly escuelasFiltradas = computed<EscuelaCursos[]>(() => {
    this.educacionService.version();

    const termino = this.terminoBusqueda().trim().toLowerCase();
    const escuelaId = this.escuelaActiva();
    const nivel = this.niveles.find((n) => n.id === this.nivelActivo())?.etiqueta;
    const formato = this.formatos.find((f) => f.id === this.formatoActivo())?.etiqueta;

    return this.educacionService.escuelas
      .filter((escuela) => !escuelaId || escuela.id === escuelaId)
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

  readonly cursoEnProgreso = computed(() => {
    this.educacionService.version();
    return this.educacionService.cursoEnProgreso();
  });

  leccionesHechas(curso: Curso): number {
    return curso.lecciones.filter((l) => l.completada).length;
  }

  minutosRestantes(curso: Curso): number {
    return this.educacionService.minutosRestantes(curso);
  }

  siguienteLeccionTitulo(curso: Curso): string {
    return this.educacionService.siguienteLeccion(curso).titulo;
  }

  siguienteLeccionNumero(curso: Curso): number {
    const siguiente = this.educacionService.siguienteLeccion(curso);
    return this.educacionService.indiceDeLeccion(curso, siguiente.id) + 1;
  }

  /** Perímetro restante del anillo de progreso (r = 26). */
  trazoAnillo(progreso: number): string {
    const circunferencia = 2 * Math.PI * 26;
    const avance = (progreso / 100) * circunferencia;
    return `${avance} ${circunferencia - avance}`;
  }

  // ---------------------------------------------------------------------
  // NAVEGACIÓN
  // ---------------------------------------------------------------------

  abrirCurso(curso: Curso): void {
    this.router.navigate(['/educacion/curso', curso.id]);
  }

  reanudar(curso: Curso): void {
    const leccion = this.educacionService.siguienteLeccion(curso);
    this.router.navigate(['/educacion/curso', curso.id, 'clase', leccion.id]);
  }
}
