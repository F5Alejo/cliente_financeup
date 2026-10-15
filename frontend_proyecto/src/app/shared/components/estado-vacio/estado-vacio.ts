import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, NombreIcono } from '../icon/icon';

@Component({
  selector: 'app-estado-vacio',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="empty-icon"><app-icon [nombre]="icono()" [tamano]="26" /></span>
      <p class="empty-title">{{ titulo() }}</p>
      @if (texto()) {
        <p class="empty-text">{{ texto() }}</p>
      }
      <div class="acciones"><ng-content /></div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 12px; }
    .acciones:empty { display: none; }
  `,
})
export class EstadoVacioComponent {
  titulo = input.required<string>();
  texto = input('');
  icono = input<NombreIcono>('inbox');
}
