import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { pasoLimpio, pesos, pesosCortos } from './comun';

export interface SerieColumnas {
  nombre: string;
  valores: readonly number[];
  /** Color de la serie: un token de color CSS. Por defecto, el verde de marca. */
  color?: string;
}

/**
 * Columnas agrupadas (una o dos series) con la identidad del horizonte: columnas
 * finas de punta redondeada y el último periodo en color pleno; los anteriores
 * quedan atenuados. Tooltip al pasar o enfocar, leyenda con 2+ series y vista de tabla.
 * Hecha en HTML/CSS para que el texto conserve su tamaño en pantallas pequeñas.
 */
@Component({
  selector: 'app-columnas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './columnas.html',
  styleUrl: './columnas.css',
})
export class ColumnasComponent {
  etiquetas = input.required<readonly string[]>();
  series = input.required<readonly SerieColumnas[]>();
  /** Qué muestra la gráfica; lo leen los lectores de pantalla y es el título de la tabla. */
  titulo = input.required<string>();
  /** Etiqueta del eje de categorías en la tabla. */
  columnaEtiqueta = input('Mes');
  formato = input<(n: number) => string>(pesos);
  formatoEje = input<(n: number) => string>(pesosCortos);
  /** Atenúa los periodos anteriores para que el actual sobresalga. */
  resaltarUltimo = input(true);
  alto = input(220);

  vistaTabla = signal(false);
  activo = signal<number | null>(null);

  readonly colores = computed(() =>
    this.series().map((s, i) => s.color ?? (i === 0 ? 'var(--brand-strong)' : 'var(--ink)')),
  );

  private readonly maximo = computed(() => {
    const mayor = Math.max(0, ...this.series().flatMap((s) => s.valores));
    return pasoLimpio(mayor / 4) * 4 || 1;
  });

  readonly marcas = computed(() => {
    const max = this.maximo();
    return [0, 1, 2, 3, 4].map((i) => ({ pct: i * 25, texto: this.formatoEje()((max * i) / 4) }));
  });

  readonly grupos = computed(() => {
    const max = this.maximo();
    const series = this.series();
    const colores = this.colores();
    const total = this.etiquetas().length;
    return this.etiquetas().map((etiqueta, i) => {
      const barras = series.map((s, j) => {
        const valor = Math.max(0, s.valores[i] ?? 0);
        return { nombre: s.nombre, valor, pct: (valor / max) * 100, color: colores[j] };
      });
      return {
        etiqueta,
        barras,
        cima: Math.max(...barras.map((b) => b.pct)),
        actual: i === total - 1,
        descripcion: `${etiqueta}: ${barras.map((b) => `${b.nombre} ${this.formato()(b.valor)}`).join(', ')}`,
      };
    });
  });

  readonly info = computed(() => {
    const i = this.activo();
    if (i === null) return null;
    const grupo = this.grupos()[i];
    const total = this.grupos().length;
    return {
      ...grupo,
      centro: ((i + 0.5) / total) * 100,
      // Cerca de los bordes el tooltip se ancla al lado para no salirse.
      ancla: i === 0 ? 'inicio' : i === total - 1 ? 'fin' : 'centro',
    };
  });
}
