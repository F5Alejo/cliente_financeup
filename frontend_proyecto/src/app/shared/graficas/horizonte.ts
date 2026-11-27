import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Horizonte: la firma visual de FinanceUp. Mini columnas con los datos reales,
 * la última (el hoy) en color pleno y las anteriores atenuadas. Es una pieza de
 * apoyo junto a una cifra: la cifra dice cuánto y el horizonte dice hacia dónde va.
 *
 *   <app-horizonte [serie]="saldoPorMes" etiqueta="Saldo de los últimos 6 meses" />
 *   <app-horizonte [serie]="..." sobre="oscuro" />   ← dentro de la banda verde
 */
@Component({
  selector: 'app-horizonte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="horizonte" [class.horizonte--oscuro]="sobre() === 'oscuro'" role="img" [attr.aria-label]="etiqueta()">
      @for (b of barras(); track $index; let ultima = $last) {
        <i [style.height.%]="b" [class.hoy]="ultima"></i>
      }
    </span>
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    .horizonte {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      width: var(--horizonte-ancho, 72px);
      height: var(--horizonte-alto, 28px);
    }
    i {
      flex: 1;
      max-width: 8px;
      min-height: 2px;
      border-radius: 2px 2px 0 0;
      background: var(--verde-200);
    }
    i.hoy { background: var(--brand-strong); }
    .horizonte--oscuro i { background: rgba(182, 223, 192, 0.32); }
    .horizonte--oscuro i.hoy { background: var(--lime); }
  `,
})
export class HorizonteComponent {
  serie = input.required<readonly number[]>();
  /** Qué muestra, para lectores de pantalla. */
  etiqueta = input.required<string>();
  sobre = input<'claro' | 'oscuro'>('claro');

  /** Alturas en %: desde el mínimo de la serie (piso del 18%) hasta el máximo. */
  readonly barras = computed(() => {
    const serie = this.serie();
    if (!serie.length) return [];
    const min = Math.min(0, ...serie);
    const max = Math.max(...serie);
    const rango = max - min || 1;
    return serie.map((v) => Math.round(18 + ((v - min) / rango) * 82));
  });
}
