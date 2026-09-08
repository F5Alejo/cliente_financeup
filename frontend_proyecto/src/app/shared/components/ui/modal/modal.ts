import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

let contador = 0;

/**
 * Diálogo centrado con fondo oscurecido.
 * Sustituye a los overlays hechos con <div (click)>, que no se podían
 * cerrar con el teclado. Aquí Escape cierra y el foco queda anunciado
 * por role="dialog" + aria-modal.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent {
  @Input() abierto = false;
  @Input() titulo = '';
  /** Permite cerrar pulsando el fondo. Se desactiva en formularios largos. */
  @Input() cerrarAlPulsarFondo = true;

  @Output() cerrar = new EventEmitter<void>();

  readonly idTitulo = `modal-titulo-${++contador}`;

  @HostListener('document:keydown.escape')
  alPulsarEscape(): void {
    if (this.abierto) {
      this.cerrar.emit();
    }
  }

  alPulsarFondo(): void {
    if (this.cerrarAlPulsarFondo) {
      this.cerrar.emit();
    }
  }
}
