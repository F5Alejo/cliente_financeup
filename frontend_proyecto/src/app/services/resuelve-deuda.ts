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

// Mismo mecanismo de persistencia que usa AuthService (sessionStorage): dura
// mientras la pestaña esté abierta, y se pierde al cerrarla — pero ya no se
// pierde con solo recargar la página (F5), que era el problema real.
const STORAGE_KEY = 'financeup_solicitudes_consolidacion';

const SOLICITUDES_INICIALES: SolicitudConsolidacion[] = [
  { id: 1, usuario: 'Sharith R.', saldoTotal: 8200000, cuotaActual: 620000, cuotaPropuesta: 410000, estado: 'Pendiente' },
  { id: 2, usuario: 'Camilo T.', saldoTotal: 3500000, cuotaActual: 310000, cuotaPropuesta: 205000, estado: 'Pendiente' },
];

@Injectable({
  providedIn: 'root',
})
export class ResuelveDeudaService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  // Fuente única de datos: cuando el usuario da clic en "Solicitar consolidación"
  // se crea aquí una solicitud real, y esa misma solicitud es la que ve y
  // gestiona el admin (antes eran dos listas separadas que no se comunicaban).
  private siguienteId: number;

  solicitudes = signal<SolicitudConsolidacion[]>(this.cargarSolicitudesGuardadas());

  constructor() {
    // El siguiente id no puede arrancar quemado en un número fijo: si ya había
    // solicitudes guardadas de una sesión anterior, hay que seguir después del
    // id más alto que exista, para no repetir un id ya usado.
    const idsExistentes = this.solicitudes().map((s) => s.id);
    this.siguienteId = idsExistentes.length > 0 ? Math.max(...idsExistentes) + 1 : 1;
  }

  private cargarSolicitudesGuardadas(): SolicitudConsolidacion[] {
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    if (!guardado) return SOLICITUDES_INICIALES;

    try {
      return JSON.parse(guardado) as SolicitudConsolidacion[];
    } catch {
      // Si el JSON guardado está corrupto (por ejemplo, alguien editó
      // sessionStorage a mano), no se rompe la app: se vuelve al set inicial.
      return SOLICITUDES_INICIALES;
    }
  }

  private guardarEnStorage(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.solicitudes()));
  }

  crearSolicitud(datos: NuevaSolicitud): void {
    this.solicitudes.update((actual) => [
      ...actual,
      { id: this.siguienteId++, ...datos, estado: 'Pendiente' },
    ]);
    this.guardarEnStorage();
  }

  cambiarEstado(id: number, estado: EstadoSolicitud): void {
    this.solicitudes.update((actual) => actual.map((s) => (s.id === id ? { ...s, estado } : s)));
    this.guardarEnStorage();
  }
}
