import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast';
import { ResuelveDeudaService, SolicitudConsolidacion, EstadoSolicitud } from '../../../services/resuelve-deuda';

@Component({
  selector: 'app-admin-resuelve-deuda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resuelve-deuda.html',
  styleUrl: './resuelve-deuda.css',
})
export class AdminResuelveDeudaComponent {
  constructor(
    private resuelveDeudaService: ResuelveDeudaService,
    private toastService: ToastService
  ) {
    console.log('Formulario Consolidacion - Solicitudes:', this.resuelveDeudaService.solicitudes());
  }

  busqueda = signal('');
  estadoFiltro = signal<'Todas' | EstadoSolicitud>('Todas');
  columnaOrden = signal<'usuario' | 'saldoTotal' | 'cuotaActual' | 'cuotaPropuesta' | null>(null);
  ordenAscendente = signal(true);

  pendientes = computed(() => this.resuelveDeudaService.solicitudes().filter(s => s.estado === 'Pendiente'));
  saldoTotalPendiente = computed(() => this.pendientes().reduce((s, x) => s + x.saldoTotal, 0));
  ahorroTotalOfrecido = computed(() =>
    this.pendientes().reduce((s, x) => s + (x.cuotaActual - x.cuotaPropuesta), 0)
  );

  get solicitudesFiltradas(): SolicitudConsolidacion[] {
    const termino = this.busqueda().trim().toLowerCase();
    let lista = this.resuelveDeudaService.solicitudes();

    if (termino) lista = lista.filter((s) => s.usuario.toLowerCase().includes(termino));
    if (this.estadoFiltro() !== 'Todas') lista = lista.filter((s) => s.estado === this.estadoFiltro());

    const columna = this.columnaOrden();
    if (columna) {
      lista = [...lista].sort((a, b) => {
        const valA = a[columna];
        const valB = b[columna];
        const comparacion = typeof valA === 'number' ? valA - (valB as number) : String(valA).localeCompare(String(valB));
        return this.ordenAscendente() ? comparacion : -comparacion;
      });
    }

    return lista;
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  filtrarPorEstado(estado: string): void {
    this.estadoFiltro.set(estado as 'Todas' | EstadoSolicitud);
  }

  ordenarPor(columna: 'usuario' | 'saldoTotal' | 'cuotaActual' | 'cuotaPropuesta'): void {
    if (this.columnaOrden() === columna) {
      this.ordenAscendente.update((v) => !v);
    } else {
      this.columnaOrden.set(columna);
      this.ordenAscendente.set(true);
    }
  }

  cambiarEstado(id: number, estado: EstadoSolicitud): void {
    this.resuelveDeudaService.cambiarEstado(id, estado);
    const solicitud = this.resuelveDeudaService.solicitudes().find(s => s.id === id);
    if (!solicitud) return;
    // Punto de extensión: aquí se dispararía la negociación real con el banco
    // (o el rechazo formal), no solo el cambio de estado en la tabla.
    this.toastService.success(`Solicitud de ${solicitud.usuario} marcada como ${estado.toLowerCase()}.`);
  }

  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }
}