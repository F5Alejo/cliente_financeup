import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstadoPqr, Pqr, PqrService, PrioridadPqr } from '../../../services/pqr';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto, simularCarga } from '../../../shared/utils/lista';

type Pestana = '' | 'pendientes' | 'Resuelto' | 'Rechazado';

interface ModalPqr {
  tipo: 'detalle' | 'eliminar';
  pqr: Pqr;
}

const CLASE_ESTADO: Record<EstadoPqr, string> = {
  Radicado: 'badge-suspendido',
  'En revisión': 'badge-pendiente',
  Resuelto: 'badge-activo',
  Rechazado: 'badge-bloqueado',
};
const CLASE_PRIORIDAD: Record<PrioridadPqr, string> = {
  Alta: 'badge-bloqueado',
  Media: 'badge-pendiente',
  Baja: 'badge-suspendido',
};

@Component({
  selector: 'app-admin-pqr',
  imports: [FormsModule, IconComponent, KpiComponent, ModalComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class AdminPqrComponent {
  private pqrService = inject(PqrService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);

  readonly estados: EstadoPqr[] = ['Radicado', 'En revisión', 'Resuelto', 'Rechazado'];
  readonly claseEstado = CLASE_ESTADO;
  readonly clasePrioridad = CLASE_PRIORIDAD;
  readonly esqueletos = [1, 2, 3, 4, 5];
  readonly pestanas: { valor: Pestana; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'Resuelto', etiqueta: 'Resueltos' },
    { valor: 'Rechazado', etiqueta: 'Rechazados' },
  ];

  pqrs = signal<Pqr[]>([...this.pqrService.pqrs]);
  cargando = simularCarga();
  busqueda = signal('');
  filtroPrioridad = signal<PrioridadPqr | ''>('');
  pestana = signal<Pestana>('');
  modal = signal<ModalPqr | null>(null);

  private esPendiente = (p: Pqr) => p.estado === 'Radicado' || p.estado === 'En revisión';

  total = computed(() => this.pqrs().length);
  pendientes = computed(() => this.pqrs().filter(this.esPendiente).length);
  resueltos = computed(() => this.pqrs().filter((p) => p.estado === 'Resuelto').length);
  rechazados = computed(() => this.pqrs().filter((p) => p.estado === 'Rechazado').length);
  altaPrioridad = computed(() => this.pqrs().filter((p) => this.esPendiente(p) && p.prioridad === 'Alta').length);

  private base = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const prioridad = this.filtroPrioridad();
    return this.pqrs().filter((p) => {
      if (texto && !normalizarTexto(`${p.titulo} ${p.numero} ${p.categoria} ${p.usuario}`).includes(texto)) return false;
      return !prioridad || p.prioridad === prioridad;
    });
  });

  conteos = computed<Record<string, number>>(() => {
    const base = this.base();
    return {
      '': base.length,
      pendientes: base.filter(this.esPendiente).length,
      Resuelto: base.filter((p) => p.estado === 'Resuelto').length,
      Rechazado: base.filter((p) => p.estado === 'Rechazado').length,
    };
  });

  filtrados = computed(() => {
    const pestana = this.pestana();
    if (!pestana) return this.base();
    return pestana === 'pendientes' ? this.base().filter(this.esPendiente) : this.base().filter((p) => p.estado === pestana);
  });

  paginador = crearPaginador(() => this.filtrados().length);
  filas = computed(() =>
    this.paginador.recortar(this.filtrados()).map((pqr) => ({ pqr, acciones: this.accionesDe(pqr) }))
  );

  constructor() {
    enlazarConShell((texto) => this.filtrar(this.busqueda, texto));
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  accionesDe(pqr: Pqr): AccionMenu[] {
    const acciones: AccionMenu[] = [{ id: 'detalle', etiqueta: 'Ver detalle', icono: 'eye' }];
    if (pqr.estado !== 'En revisión') acciones.push({ id: 'En revisión', etiqueta: 'Marcar en revisión', icono: 'clock', separador: true });
    if (pqr.estado !== 'Resuelto') acciones.push({ id: 'Resuelto', etiqueta: 'Marcar como resuelto', icono: 'check-circle', separador: pqr.estado === 'En revisión' });
    if (pqr.estado !== 'Rechazado') acciones.push({ id: 'Rechazado', etiqueta: 'Rechazar', icono: 'ban' });
    acciones.push({ id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true });
    return acciones;
  }

  alElegirAccion(id: string, pqr: Pqr): void {
    if (id === 'detalle') this.modal.set({ tipo: 'detalle', pqr });
    else if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', pqr });
    else this.cambiarEstado(pqr, id as EstadoPqr);
  }

  cambiarEstado(pqr: Pqr, estado: EstadoPqr): void {
    this.pqrService.cambiarEstado(pqr.numero, estado);
    this.actividad.registrar('PQR', `PQR ${pqr.numero} actualizada`, `Nuevo estado: ${estado}.`);
    this.toastService.success(`PQR ${pqr.numero}: ${estado.toLowerCase()}.`);
    this.refrescar();
  }

  cambiarEstadoDesdeDetalle(evento: Event): void {
    const actual = this.modal();
    if (actual) {
      this.cambiarEstado(actual.pqr, (evento.target as HTMLSelectElement).value as EstadoPqr);
    }
  }

  confirmarEliminacion(): void {
    const actual = this.modal();
    if (!actual) return;

    this.pqrService.eliminarPqr(actual.pqr.numero);
    this.actividad.registrar('PQR', `PQR ${actual.pqr.numero} eliminada`, actual.pqr.titulo);
    this.toastService.success(`PQR ${actual.pqr.numero} eliminada.`);
    this.cerrarModal();
    this.refrescar();
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  private refrescar(): void {
    this.pqrs.set([...this.pqrService.pqrs]);
    const actual = this.modal();
    if (actual?.tipo === 'detalle') {
      const vigente = this.pqrService.pqrs.find((p) => p.numero === actual.pqr.numero);
      if (vigente) this.modal.set({ tipo: 'detalle', pqr: vigente });
    }
  }
}
