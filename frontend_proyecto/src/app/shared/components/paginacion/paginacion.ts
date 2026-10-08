import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-paginacion',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-foot">
      <span>Mostrando {{ desde() }}–{{ hasta() }} de {{ total() }} {{ unidad() }}</span>
      <div class="pager">
        <button type="button" class="icon-btn" aria-label="Página anterior" [disabled]="pagina() === 1" (click)="cambiar.emit(-1)">
          <app-icon nombre="chevron-left" [tamano]="18" />
        </button>
        <span>Página {{ pagina() }} de {{ totalPaginas() }}</span>
        <button
          type="button"
          class="icon-btn"
          aria-label="Página siguiente"
          [disabled]="pagina() === totalPaginas()"
          (click)="cambiar.emit(1)">
          <app-icon nombre="chevron-right" [tamano]="18" />
        </button>
      </div>
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class PaginacionComponent {
  desde = input.required<number>();
  hasta = input.required<number>();
  total = input.required<number>();
  pagina = input.required<number>();
  totalPaginas = input.required<number>();
  unidad = input('registros');
  cambiar = output<number>();
}
