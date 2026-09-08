import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Bloque gris que ocupa el sitio del contenido mientras carga.
 * Se prefiere sobre un indicador giratorio porque conserva la forma
 * de la pantalla y evita que el diseño salte al llegar los datos.
 */
@Component({
  selector: 'app-esqueleto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './esqueleto.html',
  styleUrl: './esqueleto.css',
})
export class EsqueletoComponent {
  @Input() forma: 'texto' | 'titulo' | 'bloque' | 'circulo' = 'texto';
  /** Cuántas barras dibujar; solo aplica a la forma 'texto'. */
  @Input() lineas = 1;
  @Input() alto = '';
  @Input() ancho = '';
}
