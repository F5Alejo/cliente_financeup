import { Component, computed, signal } from '@angular/core';
import { ToastService } from '../../../shared/services/toast';

export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface SolicitudConsolidacion {
  id: number;
  usuario: string;
  saldoTotal: number;
  cuotaActual: number;
  cuotaPropuesta: number;
  estado: EstadoSolicitud;
}

/** Punto de extensión: debería venir de un servicio (ej. ResuelveDeudaService)
 *  que consulte el backend por las solicitudes reales de todos los usuarios. */
const SOLICITUDES_EJEMPLO: SolicitudConsolidacion[] = [
  { id: 1, usuario: 'Sharith R.', saldoTotal: 8200000, cuotaActual: 620000, cuotaPropuesta: 410000, estado: 'Pendiente' },
  { id: 2, usuario: 'Camilo T.', saldoTotal: 3500000, cuotaActual: 310000, cuotaPropuesta: 205000, estado: 'Pendiente' },
];

@Component({
  selector: 'app-admin-resuelve-deuda',
  standalone: true,
  imports: [],
  templateUrl: './resuelve-deuda.html',
  styleUrl: './resuelve-deuda.css',
})
export class AdminResuelveDeudaComponent {
  constructor(private toastService: ToastService) {}

  solicitudes = signal<SolicitudConsolidacion[]>(SOLICITUDES_EJEMPLO);

  pendientes = computed(() => this.solicitudes().filter(s => s.estado === 'Pendiente'));
  saldoTotalPendiente = computed(() => this.pendientes().reduce((s, x) => s + x.saldoTotal, 0));
  ahorroTotalOfrecido = computed(() =>
    this.pendientes().reduce((s, x) => s + (x.cuotaActual - x.cuotaPropuesta), 0)
  );

  cambiarEstado(id: number, estado: EstadoSolicitud): void {
    this.solicitudes.update(actual => actual.map(s => (s.id === id ? { ...s, estado } : s)));
    const solicitud = this.solicitudes().find(s => s.id === id);
    if (!solicitud) return;
    // Punto de extensión: aquí se dispararía la negociación real con el banco
    // (o el rechazo formal), no solo el cambio de estado en la tabla.
    this.toastService.success(`Solicitud de ${solicitud.usuario} marcada como ${estado.toLowerCase()}.`);
  }

  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }
}