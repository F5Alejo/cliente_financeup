import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Contenedor con superficie, borde y radio del sistema.
 * Sustituye a la clase .panel, que estaba repetida en 10 hojas de estilo.
 */
@Component({
  selector: 'app-tarjeta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta.html',
  styleUrl: './tarjeta.css',
})
export class TarjetaComponent {
  /** 'plana' no lleva sombra; 'elevada' se despega al pasar el ratón. */
  @Input() variante: 'plana' | 'elevada' = 'plana';
  @Input() relleno: 'sm' | 'md' | 'lg' = 'md';
  /** Título opcional de la cabecera. */
  @Input() titulo = '';
}
