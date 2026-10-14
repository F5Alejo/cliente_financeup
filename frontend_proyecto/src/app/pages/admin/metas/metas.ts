import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, MetasService } from '../../../services/metas';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto, simularCarga } from '../../../shared/utils/lista';

type Pestana = '' | 'cumplidas' | 'progreso';
type Columna = 'nombre' | 'actual' | 'objetivo' | 'porcentaje';

interface ModalMeta {
  tipo: 'formulario' | 'eliminar';
  meta: Meta | null;
}

const MENSAJES_ERROR: Record<string, string> = {
  nombre: 'Escribe el nombre de la meta.',
  objetivo: 'Ingresa un monto objetivo mayor a 0.',
};

@Component({
  selector: 'app-admin-metas',
  imports: [FormsModule, ReactiveFormsModule, MonedaPipe, IconComponent, KpiComponent, ModalComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class AdminMetasComponent {
  private metasService = inject(MetasService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);
  private fb = inject(FormBuilder).nonNullable;

  readonly esqueletos = [1, 2, 3, 4];
  readonly pestanas: { valor: Pestana; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'cumplidas', etiqueta: 'Cumplidas' },
    { valor: 'progreso', etiqueta: 'En progreso' },
  ];

  metas = signal<Meta[]>([...this.metasService.metas]);
  cargando = simularCarga();
  busqueda = signal('');
  pestana = signal<Pestana>('');
  orden = signal<{ columna: Columna; ascendente: boolean } | null>(null);
  modal = signal<ModalMeta | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    nombre: ['', Validators.required],
    actual: [0, Validators.min(0)],
    objetivo: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  total = computed(() => this.metas().length);
  cumplidas = computed(() => this.metas().filter((m) => m.cumplida).length);
  totalAhorrado = computed(() => this.metas().reduce((suma, m) => suma + m.actual, 0));
  totalFaltante = computed(() => this.metas().reduce((suma, m) => suma + this.faltante(m), 0));

  private base = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    return this.metas().filter((m) => !texto || normalizarTexto(m.nombre).includes(texto));
  });

  conteos = computed<Record<string, number>>(() => ({
    '': this.base().length,
    cumplidas: this.base().filter((m) => m.cumplida).length,
    progreso: this.base().filter((m) => !m.cumplida).length,
  }));

  filtradas = computed(() => {
    const pestana = this.pestana();
    let lista = [...this.base()];
    if (pestana === 'cumplidas') lista = lista.filter((m) => m.cumplida);
    if (pestana === 'progreso') lista = lista.filter((m) => !m.cumplida);

    const orden = this.orden();
    if (!orden) return lista;
    return lista.sort((a, b) => {
      const x = a[orden.columna];
      const y = b[orden.columna];
      const comparacion = typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y), 'es');
      return orden.ascendente ? comparacion : -comparacion;
    });
  });

  paginador = crearPaginador(() => this.filtradas().length);
  filas = computed(() =>
    this.paginador.recortar(this.filtradas()).map((meta) => ({
      meta,
      acciones: [
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

  faltante(meta: Meta): number {
    return Math.max(0, meta.objetivo - meta.actual);
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  ordenarPor(columna: Columna): void {
    const actual = this.orden();
    this.orden.set(actual?.columna === columna ? { columna, ascendente: !actual.ascendente } : { columna, ascendente: true });
    this.paginador.reiniciar();
  }

  flecha(columna: Columna): string {
    const actual = this.orden();
    return actual?.columna === columna ? (actual.ascendente ? '↑' : '↓') : '';
  }

  ariaOrden(columna: Columna): 'ascending' | 'descending' | 'none' {
    const actual = this.orden();
    return actual?.columna === columna ? (actual.ascendente ? 'ascending' : 'descending') : 'none';
  }

  alElegirAccion(id: string, meta: Meta): void {
    if (id === 'editar') this.abrirFormulario(meta);
    if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', meta });
  }

  abrirFormulario(meta: Meta | null = null): void {
    this.errorModal.set('');
    this.formulario.reset({ nombre: meta?.nombre ?? '', actual: meta?.actual ?? 0, objetivo: meta?.objetivo ?? null });
    this.modal.set({ tipo: 'formulario', meta });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'nombre' | 'objetivo'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  guardar(): void {
    if (this.formulario.invalid || !this.formulario.controls.nombre.value.trim()) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const nombre = valores.nombre.trim();
    const actual = Number(valores.actual) || 0;
    const objetivo = Number(valores.objetivo);

    const edicion = this.modal()?.meta;
    if (edicion) {
      this.metasService.editarMeta(edicion.id, {
        nombre,
        actual,
        objetivo,
        porcentaje: Math.min(100, Math.round((actual / objetivo) * 100)),
        cumplida: actual >= objetivo,
      });
      this.actividad.registrar('Metas', 'Meta actualizada', nombre);
      this.toastService.success('Meta actualizada correctamente.');
    } else {
      this.metasService.agregarMeta({ nombre, icono: '🎯', actual, objetivo });
      this.actividad.registrar('Metas', 'Meta creada', nombre);
      this.toastService.success('Meta agregada correctamente.');
    }
    this.cerrarModal();
    this.refrescar();
  }

  confirmarEliminacion(): void {
    const meta = this.modal()?.meta;
    if (!meta) return;

    this.metasService.eliminarMeta(meta.id);
    this.actividad.registrar('Metas', 'Meta eliminada', meta.nombre);
    this.toastService.success(`Meta «${meta.nombre}» eliminada.`);
    this.cerrarModal();
    this.refrescar();
  }

  private refrescar(): void {
    this.metas.set([...this.metasService.metas]);
  }
}
