import { Injectable, signal } from '@angular/core';

/** Lleva al módulo abierto lo que el shell o el dashboard piden: texto del buscador global o una acción rápida. */
@Injectable({ providedIn: 'root' })
export class AdminBusquedaService {
  readonly termino = signal('');
  /** Acción pedida desde otra pantalla (por ejemplo 'nuevo' para abrir el formulario de creación). */
  readonly accion = signal('');
}
