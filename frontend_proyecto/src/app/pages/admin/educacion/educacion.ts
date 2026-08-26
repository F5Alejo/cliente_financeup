import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { EducacionService } from '../../../services/educacion';
import { Curso } from '../../educacion/educacion/educacion.model';

@Component({
  selector: 'app-admin-educacion',
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './educacion.html',
  styleUrl: './educacion.css',
})
export class AdminEducacionComponent {
  editandoId: string | null = null;
  escuelaSeleccionada = '';

  formCurso: Curso = this.formularioVacio();

  constructor(public educacionService: EducacionService) {
    this.escuelaSeleccionada = this.educacionService.escuelas[0]?.id ?? '';
  }

  private formularioVacio(): Curso {
    return {
      id: '',
      titulo: '',
      imagen: 'https://picsum.photos/seed/nuevo/400/220',
      categoria: 'fundamentos',
      nivel: 'Básico',
      formato: 'Video',
      duracion: '',
      resumenLecciones: '',
      certificado: false,
      descripcion: '',
      progreso: 0,
      contenido: [],
      instructor: { nombre: '', cargo: '', iniciales: '' },
      estudiantes: 0,
      calificacion: 0,
      actualizado: '',
      aprenderas: [],
      requisitos: [],
      lecciones: [],
    };
  }

  editarCurso(escuelaId: string, curso: Curso): void {
    this.editandoId = curso.id;
    this.escuelaSeleccionada = escuelaId;
    this.formCurso = { ...curso };
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.formCurso = this.formularioVacio();
  }

  guardarCurso(): void {
    if (!this.formCurso.titulo.trim() || !this.escuelaSeleccionada) {
      return;
    }

    if (this.editandoId) {
      this.educacionService.editarCurso(this.editandoId, this.formCurso);
    } else {
      this.formCurso.id = 'curso-' + Date.now();
      this.educacionService.agregarCurso(this.escuelaSeleccionada, this.formCurso);
    }

    this.cancelarEdicion();
  }

  eliminarCurso(cursoId: string): void {
    this.educacionService.eliminarCurso(cursoId);
    if (this.editandoId === cursoId) {
      this.cancelarEdicion();
    }
  }
}
