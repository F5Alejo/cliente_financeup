import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Inversion, InversionesService } from '../../../services/inversiones';
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

type Riesgo = Inversion['riesgo'];
type Columna = 'nombre' | 'monto' | 'rendimiento' | 'rendimientoPct' | 'riesgo' | 'duracion';

interface ModalInversion {
  tipo: 'formulario' | 'eliminar';
  inversion: Inversion | null;
}

const CLASE_RIESGO: Record<Riesgo, string> = {
  Bajo: 'badge-activo',
  Medio: 'badge-pendiente',
  Alto: 'badge-bloqueado',
};
const CLASE_BARRA: Record<Riesgo, string> = { Bajo: '', Medio: 'warning', Alto: 'danger' };
const ORDEN_RIESGO: Record<Riesgo, number> = { Bajo: 1, Medio: 2, Alto: 3 };

const MENSAJES_ERROR: Record<string, string> = {
  nombre: 'Escribe el nombre de la inversión.',
  monto: 'Ingresa un monto mayor a 0.',
  duracion: 'Indica la duración (por ejemplo, 1 año).',
};

@Component({
  selector: 'app-admin-inversiones',
  imports: [FormsModule, ReactiveFormsModule, MonedaPipe, IconComponent, KpiComponent, ModalComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './inversiones.html',
  styleUrl: './inversiones.css',
})
export class AdminInversionesComponent {
  private inversionesService = inject(InversionesService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);
  private fb = inject(FormBuilder).nonNullable;

  readonly riesgos: Riesgo[] = ['Bajo', 'Medio', 'Alto'];
  readonly claseRiesgo = CLASE_RIESGO;
  readonly claseBarra = CLASE_BARRA;
  readonly esqueletos = [1, 2, 3, 4];
  readonly pestanas: { valor: Riesgo | ''; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'Bajo', etiqueta: 'Riesgo bajo' },
    { valor: 'Medio', etiqueta: 'Riesgo medio' },
    { valor: 'Alto', etiqueta: 'Riesgo alto' },
  ];

  inversiones = signal<Inversion[]>([...this.inversionesService.inversiones]);
  cargando = simularCarga();
  busqueda = signal('');
  filtroRiesgo = signal<Riesgo | ''>('');
  orden = signal<{ columna: Columna; ascendente: boolean } | null>(null);
  modal = signal<ModalInversion | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    nombre: ['', Validators.required],
    monto: [null as number | null, [Validators.required, Validators.min(1)]],
    rendimiento: [0],
    riesgo: ['Bajo' as Riesgo],
    duracion: ['', Validators.required],
  });

  totalInvertido = computed(() => this.inversiones().reduce((suma, i) => suma + i.monto, 0));
  totalRendimiento = computed(() => this.inversiones().reduce((suma, i) => suma + i.rendimiento, 0));
  rendimientoGlobal = computed(() =>
    this.totalInvertido() > 0 ? Math.round((this.totalRendimiento() / this.totalInvertido()) * 1000) / 10 : 0
  );

  distribucion = computed(() =>
    this.riesgos.map((riesgo) => {
      const valor = this.inversiones().filter((i) => i.riesgo === riesgo).reduce((suma, i) => suma + i.monto, 0);
      return { riesgo, valor, pct: this.totalInvertido() ? Math.round((valor / this.totalInvertido()) * 100) : 0 };
    })
  );

  private base = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    return this.inversiones().filter((i) => !texto || normalizarTexto(i.nombre).includes(texto));
  });

  conteos = computed<Record<string, number>>(() => ({
    '': this.base().length,
    Bajo: this.base().filter((i) => i.riesgo === 'Bajo').length,
    Medio: this.base().filter((i) => i.riesgo === 'Medio').length,
    Alto: this.base().filter((i) => i.riesgo === 'Alto').length,
  }));

  filtradas = computed(() => {
    const riesgo = this.filtroRiesgo();
    const lista = riesgo ? this.base().filter((i) => i.riesgo === riesgo) : [...this.base()];
    const orden = this.orden();
    if (!orden) return lista;

    const valor = (i: Inversion): string | number => {
      if (orden.columna === 'rendimientoPct') return this.porcentaje(i);
      if (orden.columna === 'riesgo') return ORDEN_RIESGO[i.riesgo];
      return i[orden.columna];
    };
    return lista.sort((a, b) => {
      const x = valor(a);
      const y = valor(b);
      const comparacion = typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y), 'es');
      return orden.ascendente ? comparacion : -comparacion;
    });
  });

  paginador = crearPaginador(() => this.filtradas().length);
  filas = computed(() =>
    this.paginador.recortar(this.filtradas()).map((inversion) => ({
      inversion,
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

  porcentaje(inversion: Inversion): number {
    return inversion.monto > 0 ? Math.round((inversion.rendimiento / inversion.monto) * 1000) / 10 : 0;
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

  alElegirAccion(id: string, inversion: Inversion): void {
    if (id === 'editar') this.abrirFormulario(inversion);
    if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', inversion });
  }

  abrirFormulario(inversion: Inversion | null = null): void {
    this.errorModal.set('');
    this.formulario.reset({
      nombre: inversion?.nombre ?? '',
      monto: inversion?.monto ?? null,
      rendimiento: inversion?.rendimiento ?? 0,
      riesgo: inversion?.riesgo ?? 'Bajo',
      duracion: inversion?.duracion ?? '',
    });
    this.modal.set({ tipo: 'formulario', inversion });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'nombre' | 'monto' | 'duracion'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  guardar(): void {
    if (this.formulario.invalid || !this.formulario.controls.nombre.value.trim() || !this.formulario.controls.duracion.value.trim()) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      monto: Number(valores.monto),
      rendimiento: Number(valores.rendimiento) || 0,
      riesgo: valores.riesgo,
      duracion: valores.duracion.trim(),
    };

    const edicion = this.modal()?.inversion;
    if (edicion) {
      this.inversionesService.editarInversion(edicion.id, datos);
      this.actividad.registrar('Inversiones', 'Inversión actualizada', datos.nombre);
      this.toastService.success('Inversión actualizada correctamente.');
    } else {
      this.inversionesService.agregarInversion({ id: Date.now(), ...datos });
      this.actividad.registrar('Inversiones', 'Inversión creada', datos.nombre);
      this.toastService.success('Inversión agregada correctamente.');
    }
    this.cerrarModal();
    this.refrescar();
  }

  confirmarEliminacion(): void {
    const inversion = this.modal()?.inversion;
    if (!inversion) return;

    this.inversionesService.eliminarInversion(inversion.id);
    this.actividad.registrar('Inversiones', 'Inversión eliminada', inversion.nombre);
    this.toastService.success(`Inversión «${inversion.nombre}» eliminada.`);
    this.cerrarModal();
    this.refrescar();
  }

  private refrescar(): void {
    this.inversiones.set([...this.inversionesService.inversiones]);
  }
}
