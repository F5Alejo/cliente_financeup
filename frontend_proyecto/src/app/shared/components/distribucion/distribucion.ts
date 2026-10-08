import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ItemDistribucion {
  etiqueta: string;
  valor: number;
  /** Variante de la barra; por defecto usa el verde de la marca. */
  tono?: '' | 'gray' | 'warning' | 'danger';
}

/** Barras horizontales finas: una barra por categoría, con el valor escrito junto a la etiqueta. */
@Component({
  selector: 'app-distribucion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (filas().length === 0) {
      <p class="vacio">Sin datos para mostrar.</p>
    } @else {
      <ul class="bars" [attr.aria-label]="titulo()">
        @for (fila of filas(); track fila.etiqueta) {
          <li class="bar-row">
            <div class="bar-info">
              <span class="cell-strong">{{ fila.etiqueta }}</span>
              <span class="cell-sub">{{ fila.texto }}</span>
            </div>
            <div class="progress" role="img" [attr.aria-label]="fila.etiqueta + ': ' + fila.texto">
              <span class="progress-fill" [class]="'progress-fill ' + (fila.tono ?? '')" [style.width.%]="fila.ancho"></span>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .vacio { margin: 0; color: var(--ui-text-3); }
  `,
})
export class DistribucionComponent {
  items = input.required<ItemDistribucion[]>();
  titulo = input('Distribución');
  formato = input<(n: number) => string>((n) => n.toLocaleString('es-CO'));
  /** 'total': el ancho es la participación sobre la suma. 'maximo': el ancho es relativo a la barra más grande. */
  escala = input<'total' | 'maximo'>('total');
  mostrarPorcentaje = input(true);

  filas = computed(() => {
    const items = this.items();
    const total = items.reduce((suma, i) => suma + i.valor, 0);
    const mayor = Math.max(0, ...items.map((i) => i.valor));
    const base = this.escala() === 'total' ? total : mayor;

    return items.map((i) => {
      const porcentaje = total > 0 ? Math.round((i.valor / total) * 100) : 0;
      return {
        ...i,
        ancho: base > 0 ? Math.max(i.valor > 0 ? 2 : 0, (i.valor / base) * 100) : 0,
        texto: this.mostrarPorcentaje() ? `${this.formato()(i.valor)} · ${porcentaje}%` : this.formato()(i.valor),
      };
    });
  });
}
