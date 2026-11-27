import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../../services/api';
import { EducacionService } from '../../../services/educacion';
import { Curso, FormatoCurso, NivelCurso } from '../../educacion/educacion/educacion.model';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto } from '../../../shared/utils/lista';

interface FilaCurso {
  curso: Curso;
  escuelaId: number;
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
// Las mismas que acepta la base (CHECK de modulo_educativo.categoria)
const CATEGORIAS = [
  { id: 'fundamentos', nombre: 'Fundamentos' },
  { id: 'credito', nombre: 'Crédito' },
  { id: 'ahorro', nombre: 'Ahorro' },
  { id: 'deuda', nombre: 'Deuda' },
  { id: 'fraude', nombre: 'Fraude' },
];
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
  private router = inject(Router);
  private fb = inject(FormBuilder).nonNullable;

  readonly niveles: NivelCurso[] = ['Básico', 'Intermedio', 'Avanzado'];
  readonly formatos: FormatoCurso[] = ['Video', 'Artículo', 'Quiz'];
  readonly categorias = CATEGORIAS;
  readonly claseNivel = CLASE_NIVEL;
  readonly esqueletos = [1, 2, 3, 4, 5];

  // Lista real: sale del catálogo del MID (GET /v1/cursos)
  escuelas = computed(() =>
    this.educacionService.escuelas().map((e) => ({ id: e.id, nombre: e.nombre }))
  );
  filas = computed<FilaCurso[]>(() =>
    this.educacionService.escuelas().flatMap((e) =>
      e.cursos.map((curso) => ({ curso, escuelaId: e.id, escuela: e.nombre }))
    )
  );
  cargando = this.educacionService.cargando;
  busqueda = signal('');
  filtroEscuela = signal(0);
  filtroNivel = signal<NivelCurso | ''>('');
  modal = signal<ModalCurso | null>(null);
  errorModal = signal('');
  enviando = signal(false);

  formulario = this.fb.group({
    escuela: [0, Validators.min(1)],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    categoria: ['fundamentos'],
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
        { id: 'eliminar', etiqueta: 'Retirar del catálogo', icono: 'trash', peligro: true, separador: true },
      ] as AccionMenu[],
    }))
  );

  constructor() {
    if (this.educacionService.escuelas().length === 0) {
      this.educacionService.cargarCatalogo();
    }
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
    this.filtroEscuela.set(0);
    this.filtroNivel.set('');
    this.paginador.reiniciar();
  }

  alElegirAccion(id: string, fila: FilaCurso): void {
    if (id === 'ver') this.router.navigate(['/educacion/curso', fila.curso.id]);
    if (id === 'editar') this.abrirFormulario(fila);
    if (id === 'eliminar') {
      this.errorModal.set('');
      this.modal.set({ tipo: 'eliminar', fila });
    }
  }

  abrirFormulario(fila: FilaCurso | null = null): void {
    this.errorModal.set('');
    this.formulario.reset({
      escuela: fila?.escuelaId ?? this.escuelas()[0]?.id ?? 0,
      titulo: fila?.curso.titulo ?? '',
      descripcion: fila?.curso.descripcion ?? '',
      categoria: fila?.curso.categoria || 'fundamentos',
      nivel: fila?.curso.nivel ?? 'Básico',
      formato: fila?.curso.formato ?? 'Video',
      duracion: fila?.curso.duracion ?? '',
    });
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
    const valores = this.formulario.getRawValue();

    if (this.formulario.invalid || valores.titulo.trim().length < 3) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const fila = this.modal()?.fila;
    this.ejecutar(
      this.educacionService.guardarCurso({ ...valores, idEscuela: valores.escuela }, fila?.curso.id),
      fila ? 'Curso actualizado.' : 'Curso publicado. Ya se ve en el catálogo de Educación.'
    );
  }

  confirmarEliminacion(): void {
    const fila = this.modal()?.fila;
    if (!fila) return;
    this.ejecutar(this.educacionService.retirarCurso(fila.curso.id), `Se retiró «${fila.curso.titulo}» del catálogo.`);
  }

  /** Manda la petición; si sale bien cierra el modal, si no deja el error del MID en el modal. */
  private ejecutar(peticion: Observable<unknown>, exito: string): void {
    this.enviando.set(true);
    this.errorModal.set('');
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        this.toastService.success(exito);
        this.cerrarModal();
      },
      error: (error) => {
        this.enviando.set(false);
        this.errorModal.set(mensajeDeError(error));
      },
    });
  }
}
