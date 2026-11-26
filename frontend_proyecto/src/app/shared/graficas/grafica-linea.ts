import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { pasoLimpio, pesos, pesosCortos } from './comun';

export interface PuntoLinea {
  etiqueta: string;
  valor: number;
}

/**
 * Línea de 2px con área al 10% y etiqueta en el último punto. Al pasar el cursor
 * o mover el foco con las flechas aparece la guía vertical con su tooltip.
 * El trazo es SVG estirado; textos y puntos son HTML para que no se deformen.
 */
@Component({
  selector: 'app-grafica-linea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grafica-linea.html',
  styleUrl: './grafica-linea.css',
})
export class GraficaLineaComponent {
  puntos = input.required<readonly PuntoLinea[]>();
  titulo = input.required<string>();
  formato = input<(n: number) => string>(pesos);
  formatoEje = input<(n: number) => string>(pesosCortos);
  color = input('var(--brand-strong)');
  alto = input(200);
  /** El eje parte de cero (útil para saldos); si no, se ajusta al rango de los datos. */
  desdeCero = input(false);

  activo = signal<number | null>(null);

  private readonly dominio = computed(() => {
    const valores = this.puntos().map((p) => p.valor);
    const max = Math.max(...valores);
    const min = this.desdeCero() ? Math.min(0, ...valores) : Math.min(...valores);
    const paso = pasoLimpio((max - min || Math.abs(max) || 1) / 3);
    const bajo = Math.floor(min / paso) * paso;
    const alto = Math.max(bajo + paso, Math.ceil(max / paso) * paso);
    return { bajo, alto, paso };
  });

  readonly marcas = computed(() => {
    const { bajo, alto, paso } = this.dominio();
    const lista: { pct: number; texto: string }[] = [];
    for (let v = bajo; v <= alto + paso / 2; v += paso) {
      lista.push({ pct: ((v - bajo) / (alto - bajo)) * 100, texto: this.formatoEje()(v) });
    }
    return lista;
  });

  /** Posición de cada punto en % (x de izquierda a derecha, y desde abajo). */
  readonly posiciones = computed(() => {
    const { bajo, alto } = this.dominio();
    const n = this.puntos().length;
    return this.puntos().map((p, i) => ({
      ...p,
      x: n > 1 ? (i / (n - 1)) * 100 : 50,
      y: ((p.valor - bajo) / (alto - bajo)) * 100,
    }));
  });

  readonly trazo = computed(() => this.posiciones().map((p) => `${p.x},${100 - p.y}`).join(' '));
  readonly area = computed(() => {
    const pos = this.posiciones();
    if (!pos.length) return '';
    return `M${pos[0].x},100 L${pos.map((p) => `${p.x},${100 - p.y}`).join(' L')} L${pos[pos.length - 1].x},100 Z`;
  });

  readonly ultimo = computed(() => this.posiciones().at(-1) ?? null);
  readonly info = computed(() => {
    const i = this.activo();
    return i === null ? null : this.posiciones()[i];
  });

  readonly resumen = computed(() => {
    const p = this.puntos();
    if (!p.length) return this.titulo();
    return `${this.titulo()}. De ${this.formato()(p[0].valor)} en ${p[0].etiqueta} a ${this.formato()(p[p.length - 1].valor)} en ${p[p.length - 1].etiqueta}.`;
  });

  /** Elige el punto más cercano al cursor. */
  alMover(evento: PointerEvent, plano: HTMLElement): void {
    const caja = plano.getBoundingClientRect();
    const n = this.puntos().length;
    if (n === 0 || caja.width === 0) return;
    const fraccion = (evento.clientX - caja.left) / caja.width;
    this.activo.set(Math.max(0, Math.min(n - 1, Math.round(fraccion * (n - 1)))));
  }

  alTeclado(evento: KeyboardEvent): void {
    const n = this.puntos().length;
    const actual = this.activo() ?? n - 1;
    if (evento.key === 'ArrowRight') this.activo.set(Math.min(n - 1, actual + 1));
    else if (evento.key === 'ArrowLeft') this.activo.set(Math.max(0, actual - 1));
    else return;
    evento.preventDefault();
  }
}
