import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Banda verde de marca que abre cada sección (educación, alianzas, soporte...).
 * Toma el lenguaje de la portada: verde 900 a todo el ancho, título grande con la
 * parte final en lima y el horizonte de barras del logo al fondo. Sin animación:
 * en las pantallas de trabajo lo importante es llegar rápido al contenido.
 *
 * Uso:
 *   <app-banda-seccion titulo="Compara antes de pedir," acento="solicita en un solo lugar.">
 *     <a banda-antes>Volver</a>      ← enlace de regreso, arriba del título
 *     <p>Texto de apoyo</p>          ← contenido libre debajo del título
 *     <div banda-lado>...</div>      ← columna derecha opcional
 *   </app-banda-seccion>
 */
const BARRAS = 40;
const HORIZONTE_LOGO = Array.from({ length: BARRAS }, (_, i) =>
  Math.round(14 + (i / (BARRAS - 1)) * 76 + Math.sin(i * 1.7) * 6),
);

/** Lleva la serie a n puntos por interpolación lineal, para llenar siempre el mismo ancho. */
function remuestrear(serie: readonly number[], n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const pos = (i / (n - 1)) * (serie.length - 1);
    const a = Math.floor(pos);
    const b = Math.min(serie.length - 1, a + 1);
    return serie[a] + (serie[b] - serie[a]) * (pos - a);
  });
}

@Component({
  selector: 'app-banda-seccion',
  standalone: true,
  templateUrl: './banda-seccion.html',
  styleUrl: './banda-seccion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandaSeccionComponent {
  /** Primera parte del título, en blanco. */
  titulo = input.required<string>();
  /** Final del título, en lima, en su propia línea. */
  acento = input('');
  /** Texto corto debajo del título. */
  texto = input('');
  /** id del h1, para enlazarlo con aria-labelledby si hace falta. */
  idTitulo = input('banda-titulo');

  /**
   * Datos reales para el horizonte (por ejemplo, el saldo acumulado del usuario).
   * Sin datos se dibuja el horizonte del logo, que sube de izquierda a derecha.
   */
  serie = input<readonly number[] | null>(null);

  /** Alturas en % de las 40 barras del fondo. Con datos, la última barra es el hoy y se enciende. */
  readonly horizonte = computed(() => {
    const serie = this.serie();
    if (!serie || serie.length < 2) return HORIZONTE_LOGO;
    const muestra = remuestrear(serie, BARRAS);
    const min = Math.min(...muestra);
    const max = Math.max(...muestra);
    return muestra.map((v) => Math.round(14 + ((v - min) / (max - min || 1)) * 76));
  });

  readonly conDatos = computed(() => (this.serie()?.length ?? 0) >= 2);
}
