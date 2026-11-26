import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { API_URL, mensajeDeError } from './api';

/** Movimiento de cualquier usuario, como lo ve el admin. */
export interface MovimientoAdmin {
  id: number;
  usuario: string;
  fecha: string;
  concepto: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  valor: number;
}

export interface MetaAdmin {
  id: number;
  usuario: string;
  nombre: string;
  actual: number;
  objetivo: number;
}

export interface InversionAdmin {
  id: number;
  usuario: string;
  nombre: string;
  monto: number;
  rendimiento: number;
}

interface RespuestaMid {
  movimientos: MovimientoAdmin[] | null;
  metas: MetaAdmin[] | null;
  inversiones: InversionAdmin[] | null;
}

/** Finanzas de todos los usuarios para las pantallas del admin (GET /admin/finanzas). */
@Injectable({ providedIn: 'root' })
export class FinanzasAdminService {
  private http = inject(HttpClient);

  readonly movimientos = signal<MovimientoAdmin[]>([]);
  readonly metas = signal<MetaAdmin[]>([]);
  readonly inversiones = signal<InversionAdmin[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<RespuestaMid>(`${API_URL}/admin/finanzas`).subscribe({
      next: (datos) => {
        this.movimientos.set(datos.movimientos ?? []);
        this.metas.set(datos.metas ?? []);
        this.inversiones.set(datos.inversiones ?? []);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }
}
