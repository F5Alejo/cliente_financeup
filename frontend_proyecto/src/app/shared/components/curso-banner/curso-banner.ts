import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducacionService } from '../../../services/educacion';

/**
 * Banner reutilizable que invita a tomar un curso real de Educación.
 * Se usa en los submódulos de Finanzas para conectar cada tema con una
 * clase que ya existe, en vez de dejarlo como un anuncio sin destino.
 */
@Component({
  selector: 'app-curso-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './curso-banner.html',
  styleUrl: './curso-banner.css',
})
export class CursoBannerComponent {
  private educacionService = inject(EducacionService);

  /** Pregunta o frase gancho, ej: "¿Por qué el interés compuesto rinde más?" */
  @Input() texto = '';
  /** Slug de un curso del catálogo del MID, ej: "presupuesto-50-30-20" */
  @Input() cursoId = '';

  constructor() {
    // El catálogo se pide una sola vez y lo comparten todas las pantallas
    if (this.educacionService.escuelas().length === 0) {
      this.educacionService.cargarCatalogo();
    }
  }

  get curso() {
    return this.educacionService.buscarPorSlug(this.cursoId);
  }
}
