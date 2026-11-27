/**
 * Piezas comunes del kit de gráficas de FinanceUp.
 *
 * Identidad: «el horizonte son tus datos». Las barras ascendentes del logo son la
 * forma de toda gráfica de la app: columnas finas con punta redondeada y base
 * recta, y el periodo actual (la última barra) en el color pleno de la serie.
 */

/**
 * Paleta categórica en orden fijo (validada para daltonismo sobre fondo claro).
 * El amarillo (3.º) tiene contraste bajo con el blanco: toda gráfica que lo use
 * muestra su leyenda con valores o una vista de tabla. Nunca se recicla: lo que
 * pase de 6 categorías se agrupa en «Otros».
 */
export const PALETA_CATEGORICA = ['#23873f', '#3b6fd8', '#e8a317', '#b8478f', '#e2643a', '#6b5fd1'] as const;

/** Gris neutro para el grupo «Otros». */
export const COLOR_OTROS = '#9a9aa6';

/** Redondea hacia arriba a 1, 2 o 5 por una potencia de diez, para que el eje tenga marcas limpias. */
export function pasoLimpio(valor: number): number {
  if (valor <= 0) return 1;
  const potencia = Math.pow(10, Math.floor(Math.log10(valor)));
  const fraccion = valor / potencia;
  return (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10) * potencia;
}

const FORMATO_COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Pesos completos: $1.250.000. */
export function pesos(valor: number): string {
  return FORMATO_COP.format(valor);
}

/** Pesos cortos para ejes y etiquetas: $1,2 M · $850 mil · $900. */
export function pesosCortos(valor: number): string {
  const abs = Math.abs(valor);
  const signo = valor < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${signo}$${m.toLocaleString('es-CO', { maximumFractionDigits: m >= 10 ? 0 : 1 })} M`;
  }
  if (abs >= 1_000) return `${signo}$${Math.round(abs / 1_000).toLocaleString('es-CO')} mil`;
  return `${signo}$${Math.round(abs).toLocaleString('es-CO')}`;
}

/** Ruta SVG de una columna: punta redondeada de 4px arriba y base recta sobre el eje. */
export function rutaColumna(x: number, y: number, ancho: number, alto: number, radio = 4): string {
  if (alto <= 0) return '';
  const r = Math.min(radio, alto, ancho / 2);
  return `M${x},${y + alto} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + ancho - r},${y} Q${x + ancho},${y} ${x + ancho},${y + r} L${x + ancho},${y + alto} Z`;
}

/** Nombre corto del mes: «ene», «feb»… */
export function mesCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
}
