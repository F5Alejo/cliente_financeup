import { Component, ElementRef, Injectable, computed, inject, input, output, signal } from '@angular/core';
import { IconComponent, NombreIcono } from '../icon/icon';

export interface AccionMenu {
  id: string;
  etiqueta: string;
  icono?: NombreIcono;
  peligro?: boolean;
  deshabilitado?: boolean;
  /** Dibuja una línea divisoria antes de la acción. */
  separador?: boolean;
}

/** Garantiza que solo haya un menú abierto y lo cierra al hacer clic fuera, con Escape, al desplazar o redimensionar. */
@Injectable({ providedIn: 'root' })
export class MenuAbiertoService {
  readonly abierto = signal<string | null>(null);

  constructor() {
    const cerrar = () => this.abierto.set(null);
    document.addEventListener('click', cerrar);
    document.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') {
        cerrar();
      }
    });
  }
}

const ANCHO_MENU = 236;
const ALTO_ITEM = 38;
let contador = 0;

@Component({
  selector: 'app-row-menu',
  imports: [IconComponent],
  templateUrl: './row-menu.html',
  styleUrl: './row-menu.css',
})
export class RowMenuComponent {
  private menus = inject(MenuAbiertoService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private id = `menu-${++contador}`;

  acciones = input.required<AccionMenu[]>();
  etiqueta = input('Más acciones');
  /** Si se indica, el disparador es un botón con texto en lugar del icono de tres puntos. */
  textoBoton = input('');
  iconoBoton = input<NombreIcono | null>(null);
  seleccion = output<string>();

  abierto = computed(() => this.menus.abierto() === this.id);
  posicion = signal({ arriba: 0, izquierda: 0 });

  alternar(evento: MouseEvent): void {
    evento.stopPropagation();

    if (this.abierto()) {
      this.menus.abierto.set(null);
      return;
    }

    const boton = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    const alto = this.acciones().length * ALTO_ITEM + this.acciones().filter((a) => a.separador).length * 9 + 16;
    const espacioAbajo = window.innerHeight - boton.bottom;
    const arriba = espacioAbajo < alto + 12 && boton.top > alto ? boton.top - alto - 4 : boton.bottom + 4;
    const izquierda = Math.max(8, Math.min(boton.right - ANCHO_MENU, window.innerWidth - ANCHO_MENU - 8));

    this.posicion.set({ arriba, izquierda });
    this.menus.abierto.set(this.id);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus());
  }

  elegir(accion: AccionMenu): void {
    if (accion.deshabilitado) {
      return;
    }
    this.menus.abierto.set(null);
    this.seleccion.emit(accion.id);
  }

  navegar(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') {
      return;
    }
    evento.preventDefault();

    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'));
    const actual = items.indexOf(document.activeElement as HTMLElement);
    const siguiente = evento.key === 'ArrowDown' ? (actual + 1) % items.length : (actual - 1 + items.length) % items.length;
    items[siguiente]?.focus();
  }
}
