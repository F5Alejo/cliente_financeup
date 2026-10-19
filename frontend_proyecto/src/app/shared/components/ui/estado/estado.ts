import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotonComponent } from '../boton/boton';

/**
 * Mensaje centrado para cuando no hay nada que mostrar o algo falló.
 * Un estado vacío siempre propone una salida, y uno de error siempre
 * ofrece reintentar: una pantalla en blanco no le dice nada al usuario.
 */
@Component({
  selector: 'app-estado',
  standalone: true,
  imports: [CommonModule, BotonComponent],
  templateUrl: './estado.html',
  styleUrl: './estado.css',
})
export class EstadoComponent {
  @Input() tipo: 'vacio' | 'error' = 'vacio';
  @Input() titulo = '';
  @Input() descripcion = '';
  /** Texto del botón. Si va vacío, no se dibuja ninguna acción. */
  @Input() accion = '';

  @Output() accionar = new EventEmitter<void>();
}
