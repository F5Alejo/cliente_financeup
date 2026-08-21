import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Curso,
  EscuelaCursos,
  OpcionFiltro,
  ProgresoGeneral,
} from './educacion.model';
import { EducacionService } from '../../../services/educacion';

@Component({
  selector: 'app-educacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './educacion.html',
  styleUrls: ['./educacion.css'],
})
export class EducacionComponent {
  constructor(private educacionService: EducacionService) {}

  get escuelas(): EscuelaCursos[] {
    return this.educacionService.escuelas;
  }

  // ---------------------------------------------------------------------
  // DATA — edita/agrega aquí. El HTML solo itera sobre estos arreglos,
  // así que agregar un curso nuevo es agregar un objeto más abajo.
  // ---------------------------------------------------------------------

  progresoGeneral: ProgresoGeneral = {
    porcentaje: 42,
    moduloActual: 2,
    moduloTotal: 5,
    minutosRestantes: 12,
  };

  categorias: OpcionFiltro[] = [
    { id: 'fundamentos', etiqueta: 'Fundamentos' },
    { id: 'credito', etiqueta: 'Crédito' },
    { id: 'ahorro', etiqueta: 'Ahorro' },
    { id: 'deuda', etiqueta: 'Deuda' },
    { id: 'fraude', etiqueta: 'Fraude' },
  ];

  niveles: OpcionFiltro[] = [
    { id: 'basico', etiqueta: 'Básico' },
    { id: 'intermedio', etiqueta: 'Intermedio' },
    { id: 'avanzado', etiqueta: 'Avanzado' },
  ];

  formatos: OpcionFiltro[] = [
    { id: 'video', etiqueta: 'Video' },
    { id: 'articulo', etiqueta: 'Artículo' },
    { id: 'quiz', etiqueta: 'Quiz' },
  ];

  filtrosRapidos: OpcionFiltro[] = [
    { id: 'todos', etiqueta: 'Todos' },
    { id: 'para-ti', etiqueta: 'Para ti' },
    { id: 'nuevos', etiqueta: 'Nuevos' },
  ];

  // ---------------------------------------------------------------------
  // ESTADO / INTERACCIÓN
  // ---------------------------------------------------------------------

  terminoBusqueda = '';
  filtroRapidoActivo = 'todos';
  categoriaActiva: string | null = null;
  nivelActivo: string | null = null;
  formatoActivo: string | null = null;

  /** Curso seleccionado. Si es null, se muestra el catálogo; si no, el detalle. */
  cursoSeleccionado: Curso | null = null;

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = curso;
  }

  volverAlCatalogo(): void {
    this.cursoSeleccionado = null;
  }

  seleccionarFiltroRapido(id: string): void {
    this.filtroRapidoActivo = id;
  }

  alternarCategoria(id: string): void {
    this.categoriaActiva = this.categoriaActiva === id ? null : id;
  }

  alternarNivel(id: string): void {
    this.nivelActivo = this.nivelActivo === id ? null : id;
  }

  alternarFormato(id: string): void {
    this.formatoActivo = this.formatoActivo === id ? null : id;
  }

  /** Escuelas ya filtradas por búsqueda/categoría/nivel/formato, listas para pintar. */
  get escuelasFiltradas(): EscuelaCursos[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    return this.escuelas
      .map((escuela) => ({
        ...escuela,
        cursos: escuela.cursos.filter((curso) => {
          const coincideBusqueda =
            !termino || curso.titulo.toLowerCase().includes(termino);

          const coincideCategoria =
            !this.categoriaActiva || curso.categoria === this.categoriaActiva;

          const coincideNivel =
            !this.nivelActivo ||
            curso.nivel.toLowerCase() ===
              this.niveles.find((n) => n.id === this.nivelActivo)?.etiqueta.toLowerCase();

          const coincideFormato =
            !this.formatoActivo ||
            curso.formato.toLowerCase() ===
              this.formatos.find((f) => f.id === this.formatoActivo)?.etiqueta.toLowerCase();

          return (
            coincideBusqueda && coincideCategoria && coincideNivel && coincideFormato
          );
        }),
      }))
      .filter((escuela) => escuela.cursos.length > 0);
  }

  textoProgreso(curso: Curso): string {
    return curso.progreso > 0
      ? `${curso.progreso}% completado`
      : 'Aún no has comenzado este curso.';
  }
}
