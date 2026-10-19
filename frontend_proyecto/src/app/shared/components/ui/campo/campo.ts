import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

let contador = 0;

/**
 * Envoltura de un campo de formulario: etiqueta, ayuda y error.
 * Genera el id y lo conecta con el <label>, para que ningún campo
 * quede sin nombre accesible como pasaba en 34 de los 62 inputs.
 *
 * El control real va proyectado dentro, y hay que pasarle el id:
 *   <app-campo etiqueta="Correo" #c>
 *     <input [id]="c.idCampo" [(ngModel)]="correo">
 *   </app-campo>
 */
@Component({
  selector: 'app-campo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campo.html',
  styleUrl: './campo.css',
})
export class CampoComponent {
  @Input() etiqueta = '';
  /** Texto de apoyo permanente bajo el campo. */
  @Input() ayuda = '';
  /** Mensaje de error; si viene, sustituye a la ayuda. */
  @Input() error = '';
  @Input() obligatorio = false;

  readonly idCampo = `campo-${++contador}`;

  get idDescripcion(): string {
    return `${this.idCampo}-desc`;
  }
}
