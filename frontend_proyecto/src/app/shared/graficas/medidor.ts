import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TRAMOS = 24;

/**
 * Medidor de avance con forma de horizonte: 24 tramos que suben como el logo y
 * se llenan según el avance. Reemplaza los anillos y las barras planas de progreso.
 *
 *   <app-medidor [valor]="1800000" [maximo]="2500000" etiqueta="Avance de Vacaciones" />
 */
@Component({
  selector: 'app-medidor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="medidor"
      [class.medidor--oscuro]="sobre() === 'oscuro'"
      [class.medidor--plano]="plano()"
      role="meter"
      [attr.aria-label]="etiqueta()"
      aria-valuemin="0"
      [attr.aria-valuemax]="maximo()"
      [attr.aria-valuenow]="valorAcotado()"
      [attr.aria-valuetext]="porcentaje() + '%'">
      @for (t of tramos(); track $index) {
        <i [style.height.%]="t.alto" [class.lleno]="t.lleno"></i>
      }
    </span>
  `,
  styles: `
    :host { display: block; line-height: 0; }
    .medidor {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      width: 100%;
      height: var(--medidor-alto, 22px);
    }
    i {
      flex: 1;
      border-radius: 2px 2px 0 0;
      background: var(--surface-sunk);
    }
    i.lleno { background: var(--medidor-color, var(--brand-strong)); }
    .medidor--oscuro i { background: rgba(182, 223, 192, 0.2); }
    .medidor--oscuro i.lleno { background: var(--lime); }
    .medidor--plano i { height: 100% !important; }
  `,
})
export class MedidorComponent {
  valor = input.required<number>();
  maximo = input.required<number>();
  etiqueta = input.required<string>();
  sobre = input<'claro' | 'oscuro'>('claro');
  /** Tramos de igual altura, para espacios muy bajos. */
  plano = input(false);

  readonly valorAcotado = computed(() => Math.max(0, Math.min(this.valor(), this.maximo())));
  readonly porcentaje = computed(() =>
    this.maximo() > 0 ? Math.round((this.valorAcotado() / this.maximo()) * 100) : 0,
  );

  readonly tramos = computed(() => {
    const llenos = Math.round((this.porcentaje() / 100) * TRAMOS);
    return Array.from({ length: TRAMOS }, (_, i) => ({
      alto: Math.round(38 + (i / (TRAMOS - 1)) * 62),
      // Si hay algún avance, al menos un tramo se enciende.
      lleno: i < llenos || (i === 0 && this.porcentaje() > 0),
    }));
  });
}
