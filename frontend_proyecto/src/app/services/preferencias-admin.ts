import { Injectable, signal } from '@angular/core';

export type CategoriaNotificacion = 'seguridad' | 'usuarios' | 'pqr' | 'alianzas' | 'actividad';

export interface PreferenciasAdmin {
  notificaciones: Record<CategoriaNotificacion, boolean>;
  dosFactores: boolean;
  sesionExpiraMin: number;
  sistema: {
    moneda: string;
    zonaHoraria: string;
    idioma: string;
    mantenimiento: boolean;
  };
  privacidad: {
    datosDeUso: boolean;
    mostrarUltimoAcceso: boolean;
    retencionAuditoriaDias: number;
  };
}

const LLAVE = 'financeup_admin_prefs';

const POR_DEFECTO: PreferenciasAdmin = {
  notificaciones: { seguridad: true, usuarios: true, pqr: true, alianzas: true, actividad: false },
  dosFactores: true,
  sesionExpiraMin: 30,
  sistema: { moneda: 'COP', zonaHoraria: 'America/Bogota', idioma: 'es-CO', mantenimiento: false },
  privacidad: { datosDeUso: true, mostrarUltimoAcceso: true, retencionAuditoriaDias: 365 },
};

function copiar(prefs: PreferenciasAdmin): PreferenciasAdmin {
  return JSON.parse(JSON.stringify(prefs));
}

/** Preferencias del administrador. Se guardan en este navegador; con el backend pasan a ser un recurso del perfil. */
@Injectable({ providedIn: 'root' })
export class PreferenciasAdminService {
  readonly prefs = signal<PreferenciasAdmin>(this.cargar());

  actualizar(cambios: Partial<PreferenciasAdmin>): void {
    this.prefs.update((actual) => ({ ...actual, ...cambios }));
    try {
      localStorage.setItem(LLAVE, JSON.stringify(this.prefs()));
    } catch {
      // Si el navegador bloquea el almacenamiento, la preferencia solo dura la sesión.
    }
  }

  restablecer(): void {
    this.prefs.set(copiar(POR_DEFECTO));
    try {
      localStorage.removeItem(LLAVE);
    } catch {
      // Sin almacenamiento disponible no hay nada que borrar.
    }
  }

  private cargar(): PreferenciasAdmin {
    const base = copiar(POR_DEFECTO);
    try {
      const guardado = localStorage.getItem(LLAVE);
      if (!guardado) return base;
      const datos = JSON.parse(guardado) as Partial<PreferenciasAdmin>;
      return {
        ...base,
        ...datos,
        notificaciones: { ...base.notificaciones, ...datos.notificaciones },
        sistema: { ...base.sistema, ...datos.sistema },
        privacidad: { ...base.privacidad, ...datos.privacidad },
      };
    } catch {
      return base;
    }
  }
}
