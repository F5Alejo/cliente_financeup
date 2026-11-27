import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { COMPOSICIONES, ISOTIPO, LETRAS, TamanoOptico, VarianteLogo } from './logo-trazos';

/** color: fondos claros · claro: fondos oscuros o verdes · mono: una tinta (toma `color` del contenedor) */
export type TonoLogo = 'color' | 'claro' | 'mono';

/**
 * Logo de FinanceUp en SVG en línea (sin peticiones ni ids repetidos).
 * El alto lo pone quien lo usa (`height` en el host); el ancho sale de la proporción.
 * Versiones y reglas de uso: DESIGN.md › Logo.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tono]': 'tono()', '[attr.data-variante]': 'variante()' },
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    [attr.viewBox]="comp().viewBox"
    [attr.role]="decorativo() ? null : 'img'"
    [attr.aria-label]="decorativo() ? null : etiqueta()"
    [attr.aria-hidden]="decorativo() ? 'true' : null"
    focusable="false">
    @if (comp().iso) {
      <path class="logo__curva" [attr.d]="iso().cu" />
      <path class="logo__barra" [attr.d]="iso().b1" />
      <path class="logo__barra" [attr.d]="iso().b2" />
      <path class="logo__flecha" [attr.d]="iso().fl" />
    }
    @if (comp().fin) {
      <path class="logo__fin" [attr.transform]="comp().fin" [attr.d]="letras.fin" />
      <path class="logo__up" [attr.transform]="comp().up" [attr.d]="letras.up" />
    }
  </svg>`,
  styles: `
    :host {
      /* colores del logo (no son tokens de interfaz: son los de la marca) */
      --logo-barras: #35a84d;
      --logo-curva: #7ed956;
      --logo-fin: #35a84d;
      --logo-up: #7ed956;
      display: inline-block;
      flex-shrink: 0;
      height: 40px;
      line-height: 0;
      vertical-align: middle;
    }
    :host([data-tono='claro']) {
      --logo-barras: #4cbb62;
      --logo-curva: var(--lime, #9be15d);
      --logo-fin: #ffffff;
      --logo-up: var(--lime, #9be15d);
    }
    :host([data-tono='mono']) {
      --logo-barras: currentColor;
      --logo-curva: currentColor;
      --logo-fin: currentColor;
      --logo-up: currentColor;
    }
    svg {
      display: block;
      height: 100%;
      width: auto;
      overflow: visible;
    }
    .logo__barra,
    .logo__flecha { fill: var(--logo-barras); }
    .logo__curva { fill: var(--logo-curva); }
    .logo__fin { fill: var(--logo-fin); }
    .logo__up { fill: var(--logo-up); }
  `,
})
export class LogoComponent {
  variante = input<VarianteLogo>('horizontal');
  tono = input<TonoLogo>('color');
  /** chico: cortes más abiertos para pantalla (hasta ~96 px de alto) · grande: piezas grandes o impresas */
  tamano = input<TamanoOptico>('chico');
  /** true cuando el enlace o el contenedor ya dice "FinanceUp" */
  decorativo = input(false, { transform: booleanAttribute });
  etiqueta = input('FinanceUp');

  protected readonly letras = LETRAS;
  protected comp = computed(() => COMPOSICIONES[this.tamano()][this.variante()]);
  protected iso = computed(() => ISOTIPO[this.tamano()]);
}
