import { Component, Input } from '@angular/core';
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
  /** Pregunta o frase gancho, ej: "¿Por qué el interés compuesto rinde más?" */
  @Input() texto = '';
  /** Id de un curso real del catálogo de EducacionService */
  @Input() cursoId = '';

  constructor(private educacionService: EducacionService) {}

  get curso() {
    return this.educacionService.buscarCurso(this.cursoId);
  }
}
