import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface DatoGrafico {
  etiqueta: string;
  valor: number;
}

const ANCHO = 640;
const ALTO = 240;
const MARGEN = { izquierda: 46, derecha: 12, arriba: 14, abajo: 30 };
const RADIO = 4;
const GROSOR_MAX = 24;

/** Redondea hacia arriba a 1, 2 o 5 por una potencia de diez, para que el eje tenga marcas limpias. */
function pasoLimpio(valor: number): number {
  if (valor <= 0) return 1;
  const potencia = Math.pow(10, Math.floor(Math.log10(valor)));
  const fraccion = valor / potencia;
  return (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10) * potencia;
}

@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grafico-barras.html',
  styleUrl: './grafico-barras.css',
})
export class GraficoBarrasComponent {
  datos = input.required<DatoGrafico[]>();
  /** Describe qué muestra el gráfico; lo leen los lectores de pantalla. */
  titulo = input.required<string>();
  columna = input('Valor');
  formato = input<(n: number) => string>((n) => n.toLocaleString('es-CO'));
  formatoEje = input<((n: number) => string) | null>(null);

  vistaTabla = signal(false);
  activo = signal<number | null>(null);

  readonly ancho = ANCHO;
  readonly alto = ALTO;
  readonly base = ALTO - MARGEN.abajo;
  readonly izquierda = MARGEN.izquierda;
  readonly derecha = ANCHO - MARGEN.derecha;

  private maximo = computed(() => {
    const mayor = Math.max(0, ...this.datos().map((d) => d.valor));
    return pasoLimpio(mayor / 4) * 4;
  });

  marcas = computed(() => {
    const maximo = this.maximo();
    const alturaUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    const fmt = this.formatoEje() ?? this.formato();
    return [0, 1, 2, 3, 4].map((i) => ({
      y: ALTO - MARGEN.abajo - (alturaUtil * i) / 4,
      texto: fmt((maximo * i) / 4),
    }));
  });

  barras = computed(() => {
    const datos = this.datos();
    const maximo = this.maximo();
    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const alturaUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    const ranura = anchoUtil / Math.max(1, datos.length);
    const grosor = Math.min(GROSOR_MAX, ranura * 0.6);
    const mayor = Math.max(0, ...datos.map((d) => d.valor));

    return datos.map((d, i) => {
      const altura = maximo > 0 ? (d.valor / maximo) * alturaUtil : 0;
      const x = MARGEN.izquierda + ranura * i + (ranura - grosor) / 2;
      const y = ALTO - MARGEN.abajo - altura;
      const r = Math.min(RADIO, altura);
      return {
        ...d,
        x,
        y,
        centro: x + grosor / 2,
        // Extremo superior redondeado (4px) y base cuadrada sobre el eje.
        ruta: altura > 0
          ? `M${x},${y + altura} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + grosor - r},${y} Q${x + grosor},${y} ${x + grosor},${y + r} L${x + grosor},${y + altura} Z`
          : '',
        ranuraX: MARGEN.izquierda + ranura * i,
        ranura,
        esMayor: d.valor > 0 && d.valor === mayor,
      };
    });
  });

  resumen = computed(() =>
    `${this.titulo()}. ${this.datos().map((d) => `${d.etiqueta}: ${this.formato()(d.valor)}`).join('; ')}.`
  );

  info = computed(() => {
    const i = this.activo();
    const barra = i === null ? null : this.barras()[i];
    return barra
      ? { etiqueta: barra.etiqueta, valor: this.formato()(barra.valor), izquierda: (barra.centro / ANCHO) * 100, arriba: (barra.y / ALTO) * 100 }
      : null;
  });
}
