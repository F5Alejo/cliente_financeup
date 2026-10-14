import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EducacionService } from '../../../services/educacion';
import { Curso, FormatoCurso, NivelCurso } from '../../educacion/educacion/educacion.model';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto, simularCarga } from '../../../shared/utils/lista';

interface FilaCurso {
  curso: Curso;
  escuelaId: string;
  escuela: string;
}

interface ModalCurso {
  tipo: 'formulario' | 'eliminar';
  fila: FilaCurso | null;
}

const CLASE_NIVEL: Record<NivelCurso, string> = {
  Básico: 'badge-activo',
  Intermedio: 'badge-pendiente',
  Avanzado: 'badge-suspendido',
};
const MENSAJES_ERROR: Record<string, string> = {
  titulo: 'Escribe un título de al menos 3 caracteres.',
  escuela: 'Selecciona la escuela del curso.',
};

@Component({
  selector: 'app-admin-educacion',
  imports: [FormsModule, ReactiveFormsModule, IconComponent, KpiComponent, ModalComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './educacion.html',
  styleUrl: './educacion.css',
})
export class AdminEducacionComponent {
  private educacionService = inject(EducacionService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);
  private router = inject(Router);
  private fb = inject(FormBuilder).nonNullable;

  readonly niveles: NivelCurso[] = ['Básico', 'Intermedio', 'Avanzado'];
  readonly formatos: FormatoCurso[] = ['Video', 'Artículo', 'Quiz'];
  readonly claseNivel = CLASE_NIVEL;
  readonly esqueletos = [1, 2, 3, 4, 5];

  escuelas = signal(this.leerEscuelas());
  filas = signal<FilaCurso[]>(this.leerFilas());
  cargando = simularCarga();
  busqueda = signal('');
  filtroEscuela = signal('');
  filtroNivel = signal<NivelCurso | ''>('');
  modal = signal<ModalCurso | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    escuela: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    nivel: ['Básico' as NivelCurso],
    formato: ['Video' as FormatoCurso],
    duracion: [''],
  });

  totalCursos = computed(() => this.filas().length);
  totalEstudiantes = computed(() => this.filas().reduce((suma, f) => suma + f.curso.estudiantes, 0));
  calificacionPromedio = computed(() => {
    const cursos = this.filas().filter((f) => f.curso.calificacion > 0);
    return cursos.length ? (cursos.reduce((s, f) => s + f.curso.calificacion, 0) / cursos.length).toFixed(1) : '—';
  });
  conCertificado = computed(() => this.filas().filter((f) => f.curso.certificado).length);

  filtradas = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const escuela = this.filtroEscuela();
    const nivel = this.filtroNivel();
    return this.filas().filter(
      (f) =>
        (!texto || normalizarTexto(`${f.curso.titulo} ${f.escuela}`).includes(texto)) &&
        (!escuela || f.escuelaId === escuela) &&
        (!nivel || f.curso.nivel === nivel)
    );
  });

  paginador = crearPaginador(() => this.filtradas().length);
  visibles = computed(() =>
    this.paginador.recortar(this.filtradas()).map((fila) => ({
      fila,
      acciones: [
        { id: 'ver', etiqueta: 'Ver en el sitio', icono: 'eye' },
        { id: 'editar', etiqueta: 'Editar', icono: 'pencil' },
        { id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true },
      ] as AccionMenu[],
    }))
  );

  constructor() {
    enlazarConShell(
      (texto) => this.filtrar(this.busqueda, texto),
      () => this.abrirFormulario()
    );
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  hayFiltros(): boolean {
    return !!(this.busqueda().trim() || this.filtroEscuela() || this.filtroNivel());
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEscuela.set('');
    this.filtroNivel.set('');
    this.paginador.reiniciar();
  }

  alElegirAccion(id: string, fila: FilaCurso): void {
    if (id === 'ver') this.router.navigate(['/educacion/curso', fila.curso.id]);
    if (id === 'editar') this.abrirFormulario(fila);
    if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', fila });
  }

  abrirFormulario(fila: FilaCurso | null = null): void {
    this.errorModal.set('');
    this.formulario.enable();
    this.formulario.reset({
      escuela: fila?.escuelaId ?? this.escuelas()[0]?.id ?? '',
      titulo: fila?.curso.titulo ?? '',
      descripcion: fila?.curso.descripcion ?? '',
      nivel: fila?.curso.nivel ?? 'Básico',
      formato: fila?.curso.formato ?? 'Video',
      duracion: fila?.curso.duracion ?? '',
    });
    if (fila) this.formulario.controls.escuela.disable();
    this.modal.set({ tipo: 'formulario', fila });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'titulo' | 'escuela'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim(),
      nivel: valores.nivel,
      formato: valores.formato,
      duracion: valores.duracion.trim(),
    };

    const edicion = this.modal()?.fila;
    if (edicion) {
      this.educacionService.editarCurso(edicion.curso.id, datos);
      this.actividad.registrar('Educación', 'Curso actualizado', datos.titulo);
      this.toastService.success('Curso actualizado correctamente.');
    } else {
      this.educacionService.agregarCurso(valores.escuela, { ...this.cursoVacio(), ...datos, id: 'curso-' + Date.now() });
      this.actividad.registrar('Educación', 'Curso publicado', datos.titulo);
      this.toastService.success('Curso publicado correctamente.');
    }
    this.cerrarModal();
    this.refrescar();
  }

  confirmarEliminacion(): void {
    const fila = this.modal()?.fila;
    if (!fila) return;

    this.educacionService.eliminarCurso(fila.curso.id);
    this.actividad.registrar('Educación', 'Curso eliminado', fila.curso.titulo);
    this.toastService.success(`Curso «${fila.curso.titulo}» eliminado.`);
    this.cerrarModal();
    this.refrescar();
  }

  private cursoVacio(): Curso {
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

  private leerEscuelas() {
    return this.educacionService.escuelas.map((e) => ({ id: e.id, nombre: e.nombre }));
  }

  private leerFilas(): FilaCurso[] {
    return this.educacionService.escuelas.flatMap((e) =>
      e.cursos.map((curso) => ({ curso, escuelaId: e.id, escuela: e.nombre }))
    );
  }

  private refrescar(): void {
    this.filas.set(this.leerFilas());
  }
}
