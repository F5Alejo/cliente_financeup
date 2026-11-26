import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

  /** Barras del horizonte: suben de izquierda a derecha, igual que el logo. */
  readonly horizonte = Array.from({ length: 40 }, (_, i) =>
    Math.round(14 + (i / 39) * 76 + Math.sin(i * 1.7) * 6),
  );
}
