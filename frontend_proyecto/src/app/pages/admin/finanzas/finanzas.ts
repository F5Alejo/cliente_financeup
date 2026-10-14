import { Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanzasService, Movimiento } from '../../../services/finanzas';
import { IconComponent } from '../../../shared/components/icon/icon';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { formatearFecha } from '../../../shared/utils/fechas';
import { exportarCsv, exportarExcel } from '../../../shared/utils/exportar';
import { enlazarConShell } from '../../../shared/utils/lista';

type FiltroTipo = '' | 'ingreso' | 'gasto';

interface EstadoModal {
  tipo: 'formulario' | 'eliminar';
  movimiento: Movimiento | null;
}

const TAMANO_PAGINA = 8;
const CATEGORIAS_BASE = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Servicios',
  'Educación', 'Gastos hormiga', 'Salario', 'Otros ingresos', 'Ahorro', 'Otros',
];
const METODOS_PAGO = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro'];
const MENSAJES_ERROR: Record<string, string> = {
  concepto: 'Escribe un concepto de al menos 3 caracteres.',
  categoria: 'Indica la categoría del movimiento.',
  fecha: 'Selecciona la fecha del movimiento.',
  valor: 'Ingresa un valor mayor a 0.',
};

const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const hoy = (): string => {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
};

@Component({
  selector: 'app-admin-finanzas',
  imports: [FormsModule, ReactiveFormsModule, IconComponent, ModalComponent, RowMenuComponent, MonedaPipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class AdminFinanzasComponent {
  private finanzasService = inject(FinanzasService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);
  private fb = inject(FormBuilder).nonNullable;

  readonly metodosPago = METODOS_PAGO;
  readonly pestanas: { valor: FiltroTipo; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'ingreso', etiqueta: 'Ingresos' },
    { valor: 'gasto', etiqueta: 'Gastos' },
  ];
  readonly accionesExportar: AccionMenu[] = [
    { id: 'excel', etiqueta: 'Excel (.xlsx)', icono: 'file-text' },
    { id: 'csv', etiqueta: 'CSV (.csv)', icono: 'file-text' },
  ];
  readonly esqueletos = [1, 2, 3, 4, 5, 6];

  movimientos = signal<Movimiento[]>([...this.finanzasService.movimientos]);
  cargando = signal(true);

  busqueda = signal('');
  filtroTipo = signal<FiltroTipo>('');
  filtroCategoria = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');
  avanzados = signal(false);
  pagina = signal(1);

  modal = signal<EstadoModal | null>(null);
  errorModal = signal('');
  formulario = this.fb.group({
    tipo: ['gasto' as 'ingreso' | 'gasto'],
    concepto: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', Validators.required],
    fecha: ['', Validators.required],
    valor: [null as number | null, [Validators.required, Validators.min(1)]],
    metodoPago: [''],
    observaciones: [''],
  });

  totalIngresos = computed(() => this.sumar('ingreso'));
  totalGastos = computed(() => this.sumar('gasto'));
  balance = computed(() => this.totalIngresos() - this.totalGastos());
  porcentajeGasto = computed(() => (this.totalIngresos() ? Math.round((this.totalGastos() / this.totalIngresos()) * 100) : 0));
  anchoIngresos = computed(() => this.ancho(this.totalIngresos()));
  anchoGastos = computed(() => this.ancho(this.totalGastos()));

  categorias = computed(() =>
    [...new Set([...CATEGORIAS_BASE, ...this.movimientos().map((m) => m.categoria)])].sort((a, b) => a.localeCompare(b, 'es'))
  );

  categoriasUsadas = computed(() =>
    [...new Set(this.movimientos().map((m) => m.categoria))].sort((a, b) => a.localeCompare(b, 'es'))
  );

  gastosPorCategoria = computed(() => {
    const totales = new Map<string, number>();
    for (const m of this.movimientos().filter((mov) => mov.tipo === 'gasto')) {
      totales.set(m.categoria, (totales.get(m.categoria) ?? 0) + m.valor);
    }
    const total = this.totalGastos();
    return [...totales]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([categoria, valor]) => ({ categoria, valor, pct: total ? Math.round((valor / total) * 100) : 0 }));
  });

  filtrosAvanzadosActivos = computed(
    () => (this.filtroCategoria() ? 1 : 0) + (this.fechaDesde() ? 1 : 0) + (this.fechaHasta() ? 1 : 0)
  );
  hayFiltros = computed(() => !!(this.busqueda().trim() || this.filtroTipo() || this.filtrosAvanzadosActivos()));

  private baseFiltrada = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const categoria = this.filtroCategoria();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    return this.movimientos()
      .filter((m) => {
        if (texto && !normalizar(`${m.concepto} ${m.categoria} ${m.metodoPago ?? ''}`).includes(texto)) return false;
        if (categoria && m.categoria !== categoria) return false;
        if (desde && m.fecha < desde) return false;
        if (hasta && m.fecha > hasta) return false;
        return true;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  });

  conteos = computed<Record<string, number>>(() => {
    const base = this.baseFiltrada();
    return {
      '': base.length,
      ingreso: base.filter((m) => m.tipo === 'ingreso').length,
      gasto: base.filter((m) => m.tipo === 'gasto').length,
    };
  });

  filtrados = computed(() => {
    const tipo = this.filtroTipo();
    return tipo ? this.baseFiltrada().filter((m) => m.tipo === tipo) : this.baseFiltrada();
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / TAMANO_PAGINA)));
  paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  rango = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return { desde: inicio + 1, hasta: Math.min(inicio + TAMANO_PAGINA, this.filtrados().length) };
  });

  filas = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.filtrados()
      .slice(inicio, inicio + TAMANO_PAGINA)
      .map((movimiento) => ({
        movimiento,
        acciones: [
          { id: 'editar', etiqueta: 'Editar', icono: 'pencil' },
          { id: 'duplicar', etiqueta: 'Duplicar', icono: 'copy' },
          { id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true },
        ] as AccionMenu[],
      }));
  });

  constructor() {
    enlazarConShell(
      (termino) => {
        this.busqueda.set(termino);
        this.pagina.set(1);
      },
      () => this.abrirFormulario()
    );

    // TODO: al conectar el backend, esta espera se reemplaza por el estado real de la petición HTTP.
    const temporizador = setTimeout(() => this.cargando.set(false), 700);
    inject(DestroyRef).onDestroy(() => clearTimeout(temporizador));
  }

  fecha(valor: string): string {
    return formatearFecha(valor);
  }

  esEdicion(): boolean {
    const actual = this.modal();
    return actual?.tipo === 'formulario' && actual.movimiento !== null;
  }

  filtrar<T>(senal: WritableSignal<T>, valor: T): void {
    senal.set(valor);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroTipo.set('');
    this.filtroCategoria.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.pagina.set(1);
  }

  cambiarPagina(delta: number): void {
    this.pagina.set(Math.min(Math.max(1, this.paginaActual() + delta), this.totalPaginas()));
  }

  alElegirAccion(id: string, movimiento: Movimiento): void {
    if (id === 'editar') this.abrirFormulario(movimiento);
    if (id === 'duplicar') this.abrirFormulario(movimiento, true);
    if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', movimiento });
    this.errorModal.set('');
  }

  abrirFormulario(movimiento: Movimiento | null = null, duplicar = false): void {
    this.errorModal.set('');
    this.formulario.reset({
      tipo: movimiento?.tipo ?? 'gasto',
      concepto: movimiento?.concepto ?? '',
      categoria: movimiento?.categoria ?? '',
      fecha: duplicar || !movimiento ? hoy() : movimiento.fecha,
      valor: movimiento?.valor ?? null,
      metodoPago: movimiento?.metodoPago ?? '',
      observaciones: movimiento?.observaciones ?? '',
    });
    this.modal.set({ tipo: 'formulario', movimiento: duplicar ? null : movimiento });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'concepto' | 'categoria' | 'fecha' | 'valor'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  guardarFormulario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: Omit<Movimiento, 'id'> = {
      fecha: valores.fecha,
      concepto: valores.concepto.trim(),
      categoria: valores.categoria.trim(),
      tipo: valores.tipo,
      valor: Number(valores.valor),
      metodoPago: valores.metodoPago || undefined,
      observaciones: valores.observaciones.trim() || undefined,
    };

    const edicion = this.modal()?.movimiento;
    if (edicion) {
      this.finanzasService.editarMovimiento(edicion.id, datos);
      this.actividad.registrar('Finanzas', 'Movimiento actualizado', datos.concepto);
      this.toastService.success('Movimiento actualizado correctamente.');
    } else {
      this.finanzasService.agregarMovimiento(datos);
      this.actividad.registrar('Finanzas', 'Movimiento registrado', datos.concepto);
      this.toastService.success('Movimiento registrado correctamente.');
    }
    this.cerrarModal();
    this.refrescar();
  }

  confirmarEliminacion(): void {
    const movimiento = this.modal()?.movimiento;
    if (!movimiento) return;

    this.finanzasService.eliminarMovimiento(movimiento.id);
    this.actividad.registrar('Finanzas', 'Movimiento eliminado', movimiento.concepto);
    this.toastService.success(`Movimiento "${movimiento.concepto}" eliminado.`);
    this.cerrarModal();
    this.refrescar();
  }

  exportar(formato: string): void {
    const filas = this.filtrados().map((m) => ({
      Fecha: m.fecha,
      Concepto: m.concepto,
      Categoría: m.categoria,
      Tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      Valor: m.valor,
      'Método de pago': m.metodoPago ?? '',
      Observaciones: m.observaciones ?? '',
    }));

    if (filas.length === 0) {
      this.toastService.info('No hay movimientos para exportar con los filtros actuales.');
      return;
    }

    if (formato === 'excel') {
      exportarExcel('movimientos-financeup', 'Movimientos', filas);
    } else {
      exportarCsv('movimientos-financeup', filas);
    }
    this.toastService.success(`Se exportaron ${filas.length} movimientos.`);
  }

  private sumar(tipo: 'ingreso' | 'gasto'): number {
    return this.movimientos()
      .filter((m) => m.tipo === tipo)
      .reduce((suma, m) => suma + m.valor, 0);
  }

  private ancho(valor: number): number {
    const mayor = Math.max(this.totalIngresos(), this.totalGastos());
    return mayor ? Math.max(4, Math.round((valor / mayor) * 100)) : 0;
  }

  private refrescar(): void {
    this.movimientos.set([...this.finanzasService.movimientos]);
  }
}
