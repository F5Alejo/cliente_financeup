import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetallePqr, EstadoPqr, Pqr, PqrService, PrioridadPqr } from '../../../services/pqr';
import { mensajeDeError } from '../../../services/api';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto } from '../../../shared/utils/lista';

type Pestana = '' | 'pendientes' | 'Resuelta' | 'Rechazada';

interface ModalPqr {
  tipo: 'detalle' | 'eliminar';
  pqr: Pqr;
}

const CLASE_ESTADO: Record<EstadoPqr, string> = {
  Abierta: 'badge-suspendido',
  'En revisión': 'badge-pendiente',
  Resuelta: 'badge-activo',
  Cerrada: 'badge-activo',
  Rechazada: 'badge-bloqueado',
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

  readonly estados: EstadoPqr[] = ['Abierta', 'En revisión', 'Resuelta', 'Cerrada', 'Rechazada'];
  readonly claseEstado = CLASE_ESTADO;
  readonly clasePrioridad = CLASE_PRIORIDAD;
  readonly esqueletos = [1, 2, 3, 4, 5];
  readonly pestanas: { valor: Pestana; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'Resuelta', etiqueta: 'Resueltas' },
    { valor: 'Rechazada', etiqueta: 'Rechazadas' },
  ];

  // Lista que trae el MID (GET /admin/pqr)
  readonly pqrs = this.pqrService.pqrsAdmin;
  readonly cargando = this.pqrService.cargando;
  readonly error = this.pqrService.error;

  busqueda = signal('');
  filtroPrioridad = signal<PrioridadPqr | ''>('');
  pestana = signal<Pestana>('');
  modal = signal<ModalPqr | null>(null);

  // Detalle abierto en el modal: conversación y adjuntos (GET /pqr/radicado/:radicado)
  detalle = signal<DetallePqr | null>(null);
  mensajeAdmin = '';
  estadoRespuesta: EstadoPqr = 'En revisión';
  enviando = signal(false);
  errorModal = signal('');

  private esPendiente = (p: Pqr) => p.estado === 'Abierta' || p.estado === 'En revisión';
  private esResuelta = (p: Pqr) => p.estado === 'Resuelta' || p.estado === 'Cerrada';

  total = computed(() => this.pqrs().length);
  pendientes = computed(() => this.pqrs().filter(this.esPendiente).length);
  resueltos = computed(() => this.pqrs().filter(this.esResuelta).length);
  rechazados = computed(() => this.pqrs().filter((p) => p.estado === 'Rechazada').length);
  altaPrioridad = computed(() => this.pqrs().filter((p) => this.esPendiente(p) && p.prioridad === 'Alta').length);

  private base = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const prioridad = this.filtroPrioridad();
    return this.pqrs().filter((p) => {
      if (texto && !normalizarTexto(`${p.titulo} ${p.radicado} ${p.categoria} ${p.usuario}`).includes(texto)) return false;
      return !prioridad || p.prioridad === prioridad;
    });
  });

  conteos = computed<Record<string, number>>(() => {
    const base = this.base();
    return {
      '': base.length,
      pendientes: base.filter(this.esPendiente).length,
      Resuelta: base.filter(this.esResuelta).length,
      Rechazada: base.filter((p) => p.estado === 'Rechazada').length,
    };
  });

  filtrados = computed(() => {
    const pestana = this.pestana();
    if (!pestana) return this.base();
    if (pestana === 'pendientes') return this.base().filter(this.esPendiente);
    if (pestana === 'Resuelta') return this.base().filter(this.esResuelta);
    return this.base().filter((p) => p.estado === pestana);
  });

  paginador = crearPaginador(() => this.filtrados().length);
  filas = computed(() =>
    this.paginador.recortar(this.filtrados()).map((pqr) => ({ pqr, acciones: this.accionesDe(pqr) }))
  );

  constructor() {
    enlazarConShell((texto) => this.filtrar(this.busqueda, texto));
    this.cargar();
  }

  cargar(): void {
    this.pqrService.cargarPqrAdmin();
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  accionesDe(pqr: Pqr): AccionMenu[] {
    const acciones: AccionMenu[] = [{ id: 'detalle', etiqueta: 'Ver detalle y responder', icono: 'eye' }];
    if (pqr.estado !== 'En revisión') acciones.push({ id: 'En revisión', etiqueta: 'Marcar en revisión', icono: 'clock', separador: true });
    if (pqr.estado !== 'Resuelta') acciones.push({ id: 'Resuelta', etiqueta: 'Marcar como resuelta', icono: 'check-circle', separador: pqr.estado === 'En revisión' });
    if (pqr.estado !== 'Rechazada') acciones.push({ id: 'Rechazada', etiqueta: 'Rechazar', icono: 'ban' });
    acciones.push({ id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true });
    return acciones;
  }

  alElegirAccion(id: string, pqr: Pqr): void {
    if (id === 'detalle') this.abrirDetalle(pqr);
    else if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', pqr });
    else this.cambiarEstado(pqr, id as EstadoPqr);
  }

  abrirDetalle(pqr: Pqr): void {
    this.modal.set({ tipo: 'detalle', pqr });
    this.estadoRespuesta = pqr.estado;
    this.detalle.set(null);
    this.pqrService.verPqr(pqr.radicado).subscribe({
      next: (detalle) => this.detalle.set(detalle),
      error: (error) => this.toastService.error(mensajeDeError(error)),
    });
  }

  /** Cambio rápido desde el menú: el MID exige un mensaje, así que se envía uno automático. */
  cambiarEstado(pqr: Pqr, estado: EstadoPqr): void {
    this.enviar(pqr, `Tu PQR pasó a estado «${estado}».`, estado);
  }

  enviarRespuesta(pqr: Pqr): void {
    if (!this.mensajeAdmin.trim()) {
      this.toastService.info('Escribe un mensaje antes de enviarlo.');
      return;
    }
    this.enviar(pqr, this.mensajeAdmin.trim(), this.estadoRespuesta);
  }

  confirmarEliminacion(): void {
    const pqr = this.modal()?.pqr;
    if (!pqr) return;
    this.enviando.set(true);
    this.errorModal.set('');
    this.pqrService.eliminarPqr(pqr.id).subscribe({
      next: () => {
        this.enviando.set(false);
        this.actividad.registrar('PQR', `PQR ${pqr.radicado} eliminada`, pqr.titulo);
        this.toastService.success(`PQR ${pqr.radicado} eliminada.`);
        this.cerrarModal();
      },
      error: (error) => {
        this.enviando.set(false);
        this.errorModal.set(mensajeDeError(error));
      },
    });
  }

  cerrarModal(): void {
    this.modal.set(null);
    this.errorModal.set('');
    this.detalle.set(null);
    this.mensajeAdmin = '';
  }

  private enviar(pqr: Pqr, mensaje: string, estado: EstadoPqr): void {
    this.enviando.set(true);
    this.pqrService.responderComoAdmin(pqr.id, mensaje, estado).subscribe({
      next: () => {
        this.enviando.set(false);
        this.actividad.registrar('PQR', `PQR ${pqr.radicado} actualizada`, `Estado: ${estado}.`);
        this.toastService.success(`PQR ${pqr.radicado}: ${estado.toLowerCase()}.`);
        this.mensajeAdmin = '';
        this.cargar();
        if (this.modal()?.tipo === 'detalle') this.abrirDetalle({ ...pqr, estado });
      },
      error: (error) => {
        this.enviando.set(false);
        this.toastService.error(mensajeDeError(error));
      },
    });
  }
}
