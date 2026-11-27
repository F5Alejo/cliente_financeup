import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { COLOR_OTROS, PALETA_CATEGORICA, pesos } from './comun';

export interface Parte {
  etiqueta: string;
  valor: number;
}

/**
 * Partes de un todo en una barra segmentada alta (28px), en lugar de una dona.
 * Los bloques van de mayor a menor con los colores en orden fijo; más de seis
 * categorías se agrupan en «Otros». La leyenda lleva valor y porcentaje, así que
 * hace también de tabla. Al pasar o enfocar un bloque o una fila, se resalta su pareja.
 */
@Component({
  selector: 'app-barra-partes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="partes">
      <div class="partes__barra" role="list" [attr.aria-label]="titulo()">
        @for (p of partes(); track p.etiqueta; let i = $index) {
          <span
            role="listitem"
            class="partes__bloque"
            [class.atenuado]="activo() !== null && activo() !== i"
            [style.flex-grow]="p.valor"
            [style.background]="p.color"
            [attr.aria-label]="p.etiqueta + ': ' + formato()(p.valor) + ', ' + p.pct + '%'"
            (mouseenter)="activo.set(i)"
            (mouseleave)="activo.set(null)"></span>
        }
      </div>
      <ul class="partes__leyenda">
        @for (p of partes(); track p.etiqueta; let i = $index) {
          <li
            tabindex="0"
            [class.activo]="activo() === i"
            (mouseenter)="activo.set(i)"
            (mouseleave)="activo.set(null)"
            (focus)="activo.set(i)"
            (blur)="activo.set(null)">
            <i [style.background]="p.color" aria-hidden="true"></i>
            <span class="partes__nombre">{{ p.etiqueta }}</span>
            <span class="partes__valor cifra">{{ formato()(p.valor) }}</span>
            <span class="partes__pct cifra">{{ p.pct }}%</span>
          </li>
        }
      </ul>
    </figure>
  `,
  styles: `
    :host { display: block; }
    .partes { margin: 0; }
    .partes__barra {
      display: flex;
      gap: 2px;
      height: 28px;
      border-radius: 4px;
      overflow: hidden;
    }
    .partes__bloque {
      flex-basis: 0;
      min-width: 4px;
      transition: opacity var(--dur-fast) ease;
    }
    .partes__bloque.atenuado { opacity: 0.3; }
    .partes__leyenda {
      display: grid;
      gap: 2px;
      margin: 16px 0 0;
      padding: 0;
      list-style: none;
    }
    .partes__leyenda li {
      display: grid;
      grid-template-columns: 12px minmax(0, 1fr) auto 3.2rem;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 0 8px;
      border-radius: var(--r-sm);
      font-size: 0.92rem;
      color: var(--ink-body);
    }
    .partes__leyenda li.activo { background: var(--brand-wash); }
    .partes__leyenda li:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: 1px; }
    .partes__leyenda i { width: 12px; height: 12px; border-radius: 3px; }
    .partes__nombre { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .partes__valor { font-weight: 600; color: var(--ink); }
    .partes__pct { text-align: right; color: var(--ink-soft); }
  `,
})
export class BarraPartesComponent {
  datos = input.required<readonly Parte[]>();
  titulo = input.required<string>();
  formato = input<(n: number) => string>(pesos);

  activo = signal<number | null>(null);

  readonly partes = computed(() => {
    const ordenadas = this.datos().filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
    const total = ordenadas.reduce((s, d) => s + d.valor, 0) || 1;
    const visibles = ordenadas.length > PALETA_CATEGORICA.length
      ? [
          ...ordenadas.slice(0, PALETA_CATEGORICA.length - 1),
          { etiqueta: 'Otros', valor: ordenadas.slice(PALETA_CATEGORICA.length - 1).reduce((s, d) => s + d.valor, 0) },
        ]
      : ordenadas;
    return visibles.map((d, i) => ({
      ...d,
      pct: Math.round((d.valor / total) * 100),
      color: d.etiqueta === 'Otros' && i === PALETA_CATEGORICA.length - 1 ? COLOR_OTROS : PALETA_CATEGORICA[i],
    }));
  });
}
