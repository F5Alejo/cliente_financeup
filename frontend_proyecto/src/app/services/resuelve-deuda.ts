import { Injectable, signal } from '@angular/core';

export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface SolicitudConsolidacion {
  id: number;
  usuario: string;
  saldoTotal: number;
  cuotaActual: number;
  cuotaPropuesta: number;
  estado: EstadoSolicitud;
}

export interface NuevaSolicitud {
  usuario: string;
  saldoTotal: number;
  cuotaActual: number;
  cuotaPropuesta: number;
}

@Injectable({
  providedIn: 'root',
})
export class ResuelveDeudaService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  // Fuente única de datos: cuando el usuario da clic en "Solicitar consolidación"
  // se crea aquí una solicitud real, y esa misma solicitud es la que ve y
  // gestiona el admin (antes eran dos listas separadas que no se comunicaban).
  private siguienteId = 3;

  solicitudes = signal<SolicitudConsolidacion[]>([
    { id: 1, usuario: 'Sharith R.', saldoTotal: 8200000, cuotaActual: 620000, cuotaPropuesta: 410000, estado: 'Pendiente' },
    { id: 2, usuario: 'Camilo T.', saldoTotal: 3500000, cuotaActual: 310000, cuotaPropuesta: 205000, estado: 'Pendiente' },
  ]);

  crearSolicitud(datos: NuevaSolicitud): void {
    this.solicitudes.update((actual) => [
      ...actual,
      { id: this.siguienteId++, ...datos, estado: 'Pendiente' },
    ]);
  }

  cambiarEstado(id: number, estado: EstadoSolicitud): void {
    this.solicitudes.update((actual) => actual.map((s) => (s.id === id ? { ...s, estado } : s)));
  }
}
