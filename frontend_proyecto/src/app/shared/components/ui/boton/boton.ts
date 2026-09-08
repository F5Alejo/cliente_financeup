import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type VarianteBoton = 'primario' | 'secundario' | 'suave' | 'texto' | 'peligro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

/**
 * Botón único de la aplicación. Reemplaza la clase .btn que estaba
 * redefinida en 11 hojas de estilo distintas.
 * La altura mínima es de 44px para que se pueda pulsar en móvil.
 */
@Component({
  selector: 'app-boton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton.html',
  styleUrl: './boton.css',
})
export class BotonComponent {
  @Input() variante: VarianteBoton = 'primario';
  @Input() tamano: TamanoBoton = 'md';
  @Input() tipo: 'button' | 'submit' = 'button';
  @Input() deshabilitado = false;
  /** Muestra el indicador y bloquea el botón mientras dura una operación. */
  @Input() cargando = false;
  /** Ocupa todo el ancho disponible. */
  @Input() ancho = false;
  /** Obligatorio cuando el botón solo muestra un icono. */
  @Input() etiqueta = '';

  @Output() accion = new EventEmitter<MouseEvent>();

  alPulsar(evento: MouseEvent): void {
    if (this.deshabilitado || this.cargando) return;
    this.accion.emit(evento);
  }
}
